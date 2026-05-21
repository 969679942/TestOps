from __future__ import annotations


def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Final Report Project",
            "code": "final-report-project",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_failed_run_with_analysis(client, project_id: int, tmp_path, monkeypatch):
    from app.modules.automation import service as automation_service

    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    created = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Final checkout flow",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["Cart has an item"],
            "steps": [{"text": "Submit checkout"}],
            "expected_results": [{"text": "Order is confirmed"}],
            "tags": ["final-report"],
            "automation_flag": True,
            "automation_notes": "Use generated order data.",
        },
    )
    assert created.status_code == 201
    reviewed = client.post(
        f"/test-cases/{created.json()['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready",
        },
    )
    assert reviewed.status_code == 201
    published = client.post(f"/test-cases/{created.json()['id']}/publish")
    assert published.status_code == 200
    generated = client.post(f"/test-cases/{published.json()['id']}/automation-generations")
    assert generated.status_code == 201
    run = client.post(f"/automation-generations/{generated.json()['id']}/runs")
    assert run.status_code == 201
    updated = client.patch(
        f"/automation-runs/{run.json()['id']}",
        json={
            "status": "failed",
            "report_path": "automation/runs/run-1/report/index.html",
            "summary": {"passed": 2, "failed": 1},
            "error_message": "Locator timeout on submit button",
        },
    )
    assert updated.status_code == 200
    report = client.post(
        f"/automation-runs/{run.json()['id']}/reports",
        json={
            "kind": "allure",
            "artifact_root": "automation/runs/run-1",
            "index_path": "automation/runs/run-1/report/index.html",
            "summary": {
                "passed": 2,
                "failed": 1,
                "duration_ms": 1240,
            },
        },
    )
    assert report.status_code == 201
    analysis = client.post(f"/automation-runs/{run.json()['id']}/failure-analyses")
    assert analysis.status_code == 201
    proposal = client.post(
        f"/automation-failure-analyses/{analysis.json()['id']}/debug-proposals"
    )
    assert proposal.status_code == 201
    return run.json()


def test_create_final_report_and_push_to_lark(client, tmp_path, monkeypatch):
    from app.modules.report import service as report_service

    class FakeLarkNotifier:
        def push(self, payload):
            return report_service.LarkPushResult(status="sent", error_message=None)

    monkeypatch.setattr(
        report_service,
        "get_lark_notifier",
        lambda _settings: FakeLarkNotifier(),
        raising=False,
    )
    project = _create_project(client)
    run = _create_failed_run_with_analysis(client, project["id"], tmp_path, monkeypatch)

    created = client.post(f"/automation-runs/{run['id']}/final-report")

    assert created.status_code == 201
    final_report = created.json()
    assert final_report["project_id"] == project["id"]
    assert final_report["automation_run_id"] == run["id"]
    assert final_report["status"] == "ready"
    assert final_report["summary"]["run_status"] == "failed"
    assert final_report["summary"]["allure"]["failed"] == 1
    assert final_report["summary"]["failure_analysis"]["classification"] == "automation_issue"
    assert "Final checkout flow" in final_report["content"]
    assert "Lark" in final_report["content"]

    pushed = client.post(f"/automation-final-reports/{final_report['id']}/push-lark")

    assert pushed.status_code == 200
    assert pushed.json()["lark_status"] == "sent"
    assert pushed.json()["lark_error"] is None

    listed = client.get(f"/projects/{project['id']}/automation-final-reports")
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == final_report["id"]
