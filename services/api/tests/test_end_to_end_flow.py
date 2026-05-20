def test_project_document_generation_review_publish_flow(client, monkeypatch):
    from app.modules.generation import service as generation_service

    monkeypatch.setattr(
        generation_service,
        "dispatch_generation_task",
        lambda task_id: None,
    )

    project = client.post(
        "/projects",
        json={
            "name": "Payments",
            "code": "payments",
            "description": "Checkout and payment requirements",
        },
    ).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Payments PRD",
            "source_mode": "upload",
            "source_uri": "/tmp/prd.md",
        },
    ).json()
    generation_task = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "default",
            "input_document_ids": [document["id"]],
        },
    ).json()
    test_case = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "Submit a valid checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["User has items in cart"],
            "steps": [{"text": "Open checkout page"}],
            "expected_results": [{"text": "Checkout form is displayed"}],
            "tags": ["smoke", "checkout"],
            "automation_flag": True,
            "automation_notes": "Stable happy path for downstream automation.",
        },
    ).json()

    approve = client.post(
        f"/test-cases/{test_case['id']}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready for publish",
        },
    )
    publish = client.post(f"/test-cases/{test_case['id']}/publish")
    published_cases = client.get(f"/projects/{project['id']}/published-test-cases")

    assert project["code"] == "payments"
    assert document["type"] == "prd"
    assert document["parse_status"] == "uploaded"
    assert generation_task["status"] == "queued"
    assert generation_task["input_refs"] == {"document_ids": [document["id"]]}
    assert test_case["status"] == "draft"
    assert approve.status_code == 201
    assert publish.status_code == 200
    assert publish.json()["status"] == "published"
    assert published_cases.status_code == 200
    assert [item["title"] for item in published_cases.json()] == [
        "Submit a valid checkout order"
    ]
