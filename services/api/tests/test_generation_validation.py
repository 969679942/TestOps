import importlib

import pytest


def _load_generation_service_module():
    try:
        return importlib.import_module("app.modules.generation.service")
    except ModuleNotFoundError as exc:
        pytest.fail(str(exc))


def test_normalize_generated_case_payload():
    generation_service = _load_generation_service_module()

    raw = {
        "cases": [
            {
                "title": "Create order successfully",
                "steps": ["Open order page", "Submit valid form"],
                "expected_results": ["Order created"],
            }
        ]
    }

    normalized = generation_service.normalize_generated_cases(raw)

    assert normalized[0]["title"] == "Create order successfully"
    assert normalized[0]["steps"][0]["text"] == "Open order page"
    assert normalized[0]["expected_results"][0]["text"] == "Order created"


def test_create_generation_task_rejects_unknown_provider(client):
    project = client.post("/projects", json={"name": "Checkout", "code": "checkout"}).json()

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "unknown",
            "prompt_profile": "smoke",
            "input_document_ids": [],
        },
    )

    assert response.status_code == 422


def test_create_generation_task_persists_provider_configuration(client, monkeypatch):
    project = client.post("/projects", json={"name": "Orders", "code": "orders"}).json()

    generation_service = _load_generation_service_module()
    monkeypatch.setattr(
        generation_service,
        "dispatch_generation_task",
        lambda task_id: None,
    )

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "smoke",
            "input_document_ids": [1, 2],
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "queued"
    assert response.json()["provider"] == "cursor"
    assert response.json()["prompt_version"] == "smoke"
    assert response.json()["input_refs"] == {"document_ids": [1, 2]}


def test_create_generation_task_marks_dispatch_failures(client, monkeypatch):
    project = client.post("/projects", json={"name": "Billing", "code": "billing"}).json()

    generation_service = _load_generation_service_module()
    monkeypatch.setattr(
        generation_service,
        "dispatch_generation_task",
        lambda task_id: "broker unreachable",
    )

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "smoke",
            "input_document_ids": [9],
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "failed"
    assert response.json()["error_message"] == "broker unreachable"
