from __future__ import annotations

from app.modules.automation import service as automation_service


def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Report Project",
            "code": "report-project",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_published_test_case(client, project_id: int):
    created = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Submit checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["Cart has an item"],
            "steps": [{"text": "Submit checkout"}],
            "expected_results": [{"text": "Order is confirmed"}],
            "tags": ["checkout"],
            "automation_flag": True,
            "automation_notes": "Use generated order data.",
        },
    )
    assert created.status_code == 201
    approved = client.post(
        f"/test-cases/{created.json()['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready",
        },
    )
    assert approved.status_code == 201
    published = client.post(f"/test-cases/{created.json()['id']}/publish")
    assert published.status_code == 200
    return published.json()


def _create_automation_run(client, project_id: int):
    test_case = _create_published_test_case(client, project_id)
    generated = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generated.status_code == 201
    run = client.post(f"/automation-generations/{generated.json()['id']}/runs")
    assert run.status_code == 201
    return run.json()


def test_create_report_updates_run_summary_and_lists_by_project(
    client,
    monkeypatch,
    tmp_path,
):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    run = _create_automation_run(client, project["id"])

    created = client.post(
        f"/automation-runs/{run['id']}/reports",
        json={
            "kind": "allure",
            "artifact_root": "automation/runs/run-9",
            "index_path": "automation/runs/run-9/report/index.html",
            "summary": {
                "passed": 3,
                "failed": 1,
                "duration_ms": 1240,
            },
        },
    )

    assert created.status_code == 201
    report = created.json()
    assert report["automation_run_id"] == run["id"]
    assert report["kind"] == "allure"
    assert report["artifact_root"] == "automation/runs/run-9"
    assert report["index_path"] == "automation/runs/run-9/report/index.html"
    assert report["summary"] == {
        "passed": 3,
        "failed": 1,
        "duration_ms": 1240,
    }

    runs = client.get(f"/projects/{project['id']}/automation-runs")
    assert runs.status_code == 200
    assert runs.json()[0]["report_path"] == "automation/runs/run-9/report/index.html"
    assert runs.json()[0]["summary"] == {
        "passed": 3,
        "failed": 1,
        "duration_ms": 1240,
    }

    listed = client.get(f"/projects/{project['id']}/automation-reports")
    assert listed.status_code == 200
    assert listed.json() == [report]


def test_create_report_rejects_cross_missing_run(client):
    response = client.post(
        "/automation-runs/999/reports",
        json={
            "kind": "allure",
            "artifact_root": "automation/runs/run-999",
            "index_path": "automation/runs/run-999/report/index.html",
            "summary": {},
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Automation run not found"}
