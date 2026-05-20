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
