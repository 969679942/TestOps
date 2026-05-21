from __future__ import annotations

from pathlib import Path

from app.modules.automation import service as automation_service


def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Checkout Automation",
            "code": "checkout-automation",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_published_test_case(client, project_id: int):
    created = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Submit a valid checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has an item in the cart"],
            "steps": [
                {"text": "Open the checkout page"},
                {"text": "Submit the order with valid card details"},
            ],
            "expected_results": [
                {"text": "A confirmation page is shown"},
            ],
            "tags": ["checkout", "smoke"],
            "automation_flag": True,
            "automation_notes": "Use seeded card fixture before checkout.",
        },
    )
    assert created.status_code == 201
    test_case = created.json()

    approved = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for automation",
        },
    )
    assert approved.status_code == 201

    published = client.post(f"/test-cases/{test_case['id']}/publish")
    assert published.status_code == 200
    return published.json()


def test_generate_automation_artifacts_for_published_case(client, monkeypatch, tmp_path):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    test_case = _create_published_test_case(client, project["id"])

    response = client.post(f"/test-cases/{test_case['id']}/automation-generations")

    assert response.status_code == 201
    body = response.json()
    assert body["test_case_id"] == test_case["id"]
    assert body["status"] == "completed"
    assert body["framework"] == "playwright"
    assert body["language"] == "typescript"
    assert body["pattern"] == "pom"
    assert body["error_message"] is None
    assert body["completed_at"] is not None
    assert sorted(body["artifact_paths"]) == ["page_object", "spec"]

    spec_path = Path(body["artifact_paths"]["spec"])
    page_path = Path(body["artifact_paths"]["page_object"])
    assert spec_path.exists()
    assert page_path.exists()
    assert "Submit a valid checkout order" in spec_path.read_text(encoding="utf-8")
    assert "CheckoutPage" in page_path.read_text(encoding="utf-8")


def test_list_project_automation_generations(client, monkeypatch, tmp_path):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    test_case = _create_published_test_case(client, project["id"])
    generated = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generated.status_code == 201

    response = client.get(f"/projects/{project['id']}/automation-generations")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == generated.json()["id"]
    assert body[0]["test_case_id"] == test_case["id"]
    assert body[0]["status"] == "completed"
    assert sorted(body[0]["artifact_paths"]) == ["page_object", "spec"]


def test_create_and_list_automation_runs(client, monkeypatch, tmp_path):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    test_case = _create_published_test_case(client, project["id"])
    generated = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generated.status_code == 201
    generation_id = generated.json()["id"]

    created = client.post(f"/automation-generations/{generation_id}/runs")

    assert created.status_code == 201
    run = created.json()
    assert run["automation_generation_id"] == generation_id
    assert run["status"] == "queued"
    assert run["trigger_mode"] == "manual"
    assert run["summary"] == {}
    assert run["report_path"] is None
    assert run["started_at"] is None
    assert run["finished_at"] is None

    listed = client.get(f"/projects/{project['id']}/automation-runs")

    assert listed.status_code == 200
    body = listed.json()
    assert len(body) == 1
    assert body[0]["id"] == run["id"]
    assert body[0]["automation_generation_id"] == generation_id
    assert body[0]["status"] == "queued"


def test_update_automation_run_result(client, monkeypatch, tmp_path):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    test_case = _create_published_test_case(client, project["id"])
    generated = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generated.status_code == 201
    created = client.post(f"/automation-generations/{generated.json()['id']}/runs")
    assert created.status_code == 201

    response = client.patch(
        f"/automation-runs/{created.json()['id']}",
        json={
            "status": "failed",
            "report_path": "automation/reports/run-1/index.html",
            "summary": {
                "passed": 3,
                "failed": 1,
                "duration_ms": 1240,
            },
            "error_message": "Locator timeout on checkout submit button",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "failed"
    assert body["report_path"] == "automation/reports/run-1/index.html"
    assert body["summary"] == {
        "passed": 3,
        "failed": 1,
        "duration_ms": 1240,
    }
    assert body["error_message"] == "Locator timeout on checkout submit button"
    assert body["finished_at"] is not None

    listed = client.get(f"/projects/{project['id']}/automation-runs")
    assert listed.status_code == 200
    assert listed.json()[0]["status"] == "failed"
    assert listed.json()[0]["summary"]["failed"] == 1


def test_create_and_list_failure_analysis_for_failed_run(client, monkeypatch, tmp_path):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    test_case = _create_published_test_case(client, project["id"])
    generated = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generated.status_code == 201
    created_run = client.post(f"/automation-generations/{generated.json()['id']}/runs")
    assert created_run.status_code == 201
    updated_run = client.patch(
        f"/automation-runs/{created_run.json()['id']}",
        json={
            "status": "failed",
            "report_path": "automation/reports/run-1/index.html",
            "summary": {"passed": 3, "failed": 1},
            "error_message": "Locator timeout on checkout submit button",
        },
    )
    assert updated_run.status_code == 200

    response = client.post(
        f"/automation-runs/{created_run.json()['id']}/failure-analyses"
    )

    assert response.status_code == 201
    analysis = response.json()
    assert analysis["automation_run_id"] == created_run.json()["id"]
    assert analysis["status"] == "completed"
    assert analysis["provider"] == "codex"
    assert analysis["classification"] == "automation_issue"
    assert analysis["should_rerun"] is True
    assert analysis["confidence"] >= 0.5
    assert "Locator timeout" in analysis["summary"]
    assert analysis["completed_at"] is not None

    listed = client.get(f"/projects/{project['id']}/automation-failure-analyses")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == analysis["id"]


def test_generate_automation_rejects_unpublished_case(client):
    project = _create_project(client)
    created = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "Draft checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has an item in the cart"],
            "steps": [{"text": "Open checkout"}],
            "expected_results": [{"text": "Checkout opens"}],
            "tags": ["checkout"],
            "automation_flag": True,
            "automation_notes": None,
        },
    )
    assert created.status_code == 201

    response = client.post(
        f"/test-cases/{created.json()['id']}/automation-generations"
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Only published test cases can generate automation"
    }
