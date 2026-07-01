import importlib

import pytest

ARCHIVED_PROJECT_MESSAGE = "Project is archived. Restore it before making changes."


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

    normalized = generation_service.normalize_generated_cases(
        raw,
        input_refs={},
        context_bundle={},
    )

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
            "input_document_version_ids": [1],
            "input_skill_version_id": 1,
        },
    )

    assert response.status_code == 422


def test_create_generation_task_rejects_archived_project(client):
    project = client.post("/projects", json={"name": "Archive Gen", "code": "archive-gen"}).json()
    archive_response = client.patch(
        f"/projects/{project['id']}/status",
        json={"status": "archived"},
    )

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "smoke",
            "input_document_version_ids": [1],
            "input_skill_version_id": 1,
        },
    )

    assert archive_response.status_code == 200
    assert response.status_code == 409
    assert response.json() == {"detail": ARCHIVED_PROJECT_MESSAGE}


def test_create_generation_task_requires_a_skill_selection(client):
    project = client.post("/projects", json={"name": "Need Skill", "code": "need-skill"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Need Skill PRD",
            "source_mode": "upload",
            "source_uri": "storage://docs/need-skill.md",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "need-skill.md", "content": "# Need Skill"},
    ).json()

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "default",
            "input_document_version_ids": [version["id"]],
        },
    )

    assert response.status_code == 422
    assert "input_skill_version_id or input_skill_binding_id" in response.text


def test_create_generation_task_persists_provider_configuration(client, monkeypatch):
    project = client.post("/projects", json={"name": "Orders", "code": "orders"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": "storage://docs/checkout.md",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "checkout.md", "content": "# Checkout"},
    ).json()
    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "orders", "name": "Orders Skill"},
    ).json()
    skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={
            "summary": "Orders v1",
            "content": {"scenario_taxonomy": ["happy_path"], "review_checklist": ["traceable"]},
        },
    ).json()

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
            "input_document_version_ids": [version["id"]],
            "input_skill_version_id": skill_version["id"],
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "queued"
    assert response.json()["provider"] == "cursor"
    assert response.json()["prompt_version"] == "smoke"
    assert response.json()["input_refs"] == {
        "document_version_ids": [version["id"]],
        "skill_version_id": skill_version["id"],
        "seed_test_case_ids": [],
        "coverage_gap_note": None,
    }


def test_create_generation_task_marks_dispatch_failures(client, monkeypatch):
    project = client.post("/projects", json={"name": "Billing", "code": "billing"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Billing PRD",
            "source_mode": "upload",
            "source_uri": "storage://docs/billing.md",
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "billing.md", "content": "# Billing"},
    ).json()
    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "billing", "name": "Billing Skill"},
    ).json()
    skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={
            "summary": "Billing v1",
            "content": {"scenario_taxonomy": ["happy_path"], "review_checklist": ["traceable"]},
        },
    ).json()

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
            "input_document_version_ids": [version["id"]],
            "input_skill_version_id": skill_version["id"],
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "failed"
    assert response.json()["error_message"] == "broker unreachable"


def test_list_generation_tasks_returns_project_history(client, monkeypatch):
    project = client.post("/projects", json={"name": "Search", "code": "search"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Search PRD",
            "source_mode": "upload",
            "source_uri": "storage://docs/search.md",
        },
    ).json()
    first_version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "search-v1.md", "content": "# Search v1"},
    ).json()
    second_version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "search-v2.md", "content": "# Search v2"},
    ).json()
    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "search", "name": "Search Skill"},
    ).json()
    first_skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={
            "summary": "Search v1",
            "content": {"scenario_taxonomy": ["happy_path"], "review_checklist": ["traceable"]},
        },
    ).json()
    second_skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={
            "summary": "Search v2",
            "content": {"scenario_taxonomy": ["boundary"], "review_checklist": ["traceable"]},
        },
    ).json()

    generation_service = _load_generation_service_module()
    monkeypatch.setattr(
        generation_service,
        "dispatch_generation_task",
        lambda task_id: None,
    )

    first_response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "default",
            "input_document_version_ids": [first_version["id"]],
            "input_skill_version_id": first_skill_version["id"],
        },
    )
    second_response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "openai",
            "prompt_profile": "review-heavy",
            "input_document_version_ids": [first_version["id"], second_version["id"]],
            "input_skill_version_id": second_skill_version["id"],
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get(f"/projects/{project['id']}/generation-tasks")

    assert response.status_code == 200
    payload = response.json()
    assert [item["provider"] for item in payload] == ["openai", "cursor"]
    assert payload[0]["input_refs"] == {
        "document_version_ids": [first_version["id"], second_version["id"]],
        "skill_version_id": second_skill_version["id"],
        "seed_test_case_ids": [],
        "coverage_gap_note": None,
    }


def test_list_generation_tasks_returns_not_found_for_unknown_project(client):
    response = client.get("/projects/9999/generation-tasks")

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}
