from __future__ import annotations


def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Debug Proposal Project",
            "code": "debug-proposal-project",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_retryable_analysis(client, project_id: int, tmp_path, monkeypatch):
    from app.modules.automation import service as automation_service

    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    created = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Debug flaky checkout",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["Cart has an item"],
            "steps": [{"text": "Submit checkout"}],
            "expected_results": [{"text": "Order is confirmed"}],
            "tags": ["debug"],
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
    analysis = client.post(f"/automation-runs/{run.json()['id']}/failure-analyses")
    assert analysis.status_code == 201
    assert analysis.json()["should_rerun"] is True
    return analysis.json()


def test_debug_proposal_requires_review_before_controlled_rerun(
    client,
    tmp_path,
    monkeypatch,
):
    project = _create_project(client)
    analysis = _create_retryable_analysis(client, project["id"], tmp_path, monkeypatch)

    created = client.post(
        f"/automation-failure-analyses/{analysis['id']}/debug-proposals"
    )

    assert created.status_code == 201
    proposal = created.json()
    assert proposal["automation_failure_analysis_id"] == analysis["id"]
    assert proposal["status"] == "draft"
    assert proposal["proposal_type"] == "patch_proposal"
    assert proposal["patch_proposal"]["manual_review_required"] is True
    assert proposal["recommendations"]

    blocked = client.post(f"/automation-debug-proposals/{proposal['id']}/rerun")
    assert blocked.status_code == 409
    assert blocked.json() == {"detail": "Debug proposal must be approved before rerun"}

    reviewed = client.patch(
        f"/automation-debug-proposals/{proposal['id']}/review",
        json={
            "action": "approve",
            "reviewer_id": "qa.lead",
            "comment": "Patch proposal is safe to rerun.",
        },
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "approved"
    assert reviewed.json()["reviewer_id"] == "qa.lead"

    rerun = client.post(f"/automation-debug-proposals/{proposal['id']}/rerun")
    assert rerun.status_code == 201
    assert rerun.json()["status"] == "queued"
    assert rerun.json()["trigger_mode"] == "debug_rerun"

    listed = client.get(f"/projects/{project['id']}/automation-debug-proposals")
    assert listed.status_code == 200
    assert listed.json()[0]["status"] == "applied"
