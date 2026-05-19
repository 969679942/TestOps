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
