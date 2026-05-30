def test_list_projects_and_mock_generation(client):
    project = client.post(
        "/projects",
        json={"name": "Generation UI", "code": "generation-ui"},
    ).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": "prd/checkout.pdf",
        },
    ).json()

    generation = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={"provider": "mock", "input_document_ids": [document["id"]]},
    )
    test_cases = client.get(f"/projects/{project['id']}/test-cases")
    projects = client.get("/projects")

    assert generation.status_code == 201
    assert generation.json()["status"] == "completed"
    assert test_cases.status_code == 200
    assert len(test_cases.json()) == 3
    assert projects.status_code == 200
    assert any(item["id"] == project["id"] for item in projects.json())
