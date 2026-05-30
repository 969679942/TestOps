from __future__ import annotations


def _create_project(client, code: str = "schedule-project"):
    response = client.post(
        "/projects",
        json={
            "name": f"Schedule Project {code}",
            "code": code,
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_environment(client, project_id: int):
    response = client.post(
        f"/projects/{project_id}/environments",
        json={
            "name": "Schedule Staging",
            "code": "staging",
            "base_url": "https://staging.schedule.example",
            "api_base_url": "https://api-staging.schedule.example",
            "auth_profile": "qa-staging",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_completed_generation(client, project_id: int):
    created = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Submit scheduled checkout",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["Cart has an item"],
            "steps": [{"text": "Submit checkout"}],
            "expected_results": [{"text": "Order is confirmed"}],
            "tags": ["schedule"],
            "automation_flag": True,
            "automation_notes": "Run in scheduled smoke suite.",
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
    generated = client.post(
        f"/test-cases/{published.json()['id']}/automation-generations"
    )
    assert generated.status_code == 201
    return generated.json()


def test_create_and_list_automation_schedules(client, tmp_path, monkeypatch):
    from app.modules.automation import service as automation_service

    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    environment = _create_environment(client, project["id"])
    generation = _create_completed_generation(client, project["id"])

    created = client.post(
        f"/projects/{project['id']}/automation-schedules",
        json={
            "name": "Hourly smoke",
            "environment_id": environment["id"],
            "target_generation_ids": [generation["id"]],
            "cron_expression": "@hourly",
            "next_run_at": "2026-05-21T10:00:00",
        },
    )

    assert created.status_code == 201
    schedule = created.json()
    assert schedule["project_id"] == project["id"]
    assert schedule["environment_id"] == environment["id"]
    assert schedule["target_generation_ids"] == [generation["id"]]
    assert schedule["status"] == "active"
    assert schedule["cron_expression"] == "@hourly"
    assert schedule["last_run_at"] is None

    listed = client.get(f"/projects/{project['id']}/automation-schedules")
    assert listed.status_code == 200
    assert listed.json() == [schedule]


def test_create_automation_schedule_rejects_cross_project_references(
    client,
    tmp_path,
    monkeypatch,
):
    from app.modules.automation import service as automation_service

    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client, "schedule-project-a")
    other_project = _create_project(client, "schedule-project-b")
    environment = _create_environment(client, project["id"])
    other_generation = _create_completed_generation(client, other_project["id"])

    response = client.post(
        f"/projects/{project['id']}/automation-schedules",
        json={
            "name": "Invalid cross project suite",
            "environment_id": environment["id"],
            "target_generation_ids": [other_generation["id"]],
            "cron_expression": "@hourly",
            "next_run_at": "2026-05-21T10:00:00",
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Automation schedule references must belong to the same project"
    }
