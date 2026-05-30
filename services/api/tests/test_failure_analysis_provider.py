from __future__ import annotations

from app.modules.automation import service as automation_service


def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Failure Provider Project",
            "code": "failure-provider-project",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_failed_run_with_report(client, project_id: int):
    created = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Submit provider checkout",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["Cart has an item"],
            "steps": [{"text": "Submit checkout"}],
            "expected_results": [{"text": "Order is confirmed"}],
            "tags": ["provider"],
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
            "summary": {
                "passed": 2,
                "failed": 1,
            },
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
    return updated.json()


def test_failure_analysis_uses_provider_boundary_with_run_and_report_context(
    client,
    tmp_path,
    monkeypatch,
):
    from app.modules.automation import failure_provider

    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    captured = {}

    class FakeProvider:
        name = "codex"
        model = "codex-test-provider"

        def analyze(self, request):
            captured["request"] = request
            return failure_provider.FailureAnalysisResult(
                classification="automation_issue",
                confidence=0.91,
                summary="Provider saw the run error and Allure report summary.",
                recommendations=[
                    "Stabilize the submit button locator.",
                    "Rerun after reviewer approval.",
                ],
                should_rerun=True,
            )

    monkeypatch.setattr(
        automation_service,
        "get_failure_analysis_provider",
        lambda _settings: FakeProvider(),
        raising=False,
    )
    project = _create_project(client)
    run = _create_failed_run_with_report(client, project["id"])

    response = client.post(f"/automation-runs/{run['id']}/failure-analyses")

    assert response.status_code == 201
    analysis = response.json()
    assert analysis["provider"] == "codex"
    assert analysis["model"] == "codex-test-provider"
    assert analysis["classification"] == "automation_issue"
    assert analysis["confidence"] == 0.91
    assert analysis["should_rerun"] is True
    assert analysis["recommendations"] == [
        "Stabilize the submit button locator.",
        "Rerun after reviewer approval.",
    ]
    assert captured["request"].automation_run_id == run["id"]
    assert captured["request"].run_summary == {
        "passed": 2,
        "failed": 1,
        "duration_ms": 1240,
    }
    assert captured["request"].error_message == "Locator timeout on submit button"
    assert captured["request"].reports[0].summary == {
        "passed": 2,
        "failed": 1,
        "duration_ms": 1240,
    }
    assert captured["request"].reports[0].index_path == "automation/runs/run-1/report/index.html"
