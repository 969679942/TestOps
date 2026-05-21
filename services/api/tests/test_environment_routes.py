def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Payments Platform",
            "code": "payments",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_and_list_project_environments(client):
    project = _create_project(client)

    created = client.post(
        f"/projects/{project['id']}/environments",
        json={
            "name": "Payments Staging",
            "code": "staging",
            "base_url": "https://staging.payments.example",
            "api_base_url": "https://api-staging.payments.example",
            "auth_profile": "qa-staging",
        },
    )

    assert created.status_code == 201
    environment = created.json()
    assert environment["project_id"] == project["id"]
    assert environment["name"] == "Payments Staging"
    assert environment["code"] == "staging"
    assert environment["base_url"] == "https://staging.payments.example"
    assert environment["api_base_url"] == "https://api-staging.payments.example"
    assert environment["auth_profile"] == "qa-staging"
    assert environment["status"] == "active"

    listed = client.get(f"/projects/{project['id']}/environments")

    assert listed.status_code == 200
    assert listed.json() == [environment]


def test_update_project_environment(client):
    project = _create_project(client)
    created = client.post(
        f"/projects/{project['id']}/environments",
        json={
            "name": "Payments Staging",
            "code": "staging",
            "base_url": "https://staging.payments.example",
            "api_base_url": "https://api-staging.payments.example",
            "auth_profile": "qa-staging",
        },
    )
    assert created.status_code == 201

    response = client.patch(
        f"/environments/{created.json()['id']}",
        json={
            "name": "Payments QA",
            "base_url": "https://qa.payments.example",
            "api_base_url": "https://api-qa.payments.example",
            "auth_profile": "qa-profile",
            "status": "paused",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Payments QA"
    assert body["code"] == "staging"
    assert body["base_url"] == "https://qa.payments.example"
    assert body["api_base_url"] == "https://api-qa.payments.example"
    assert body["auth_profile"] == "qa-profile"
    assert body["status"] == "paused"


def test_create_environment_rejects_missing_project(client):
    response = client.post(
        "/projects/999/environments",
        json={
            "name": "Missing Project Env",
            "code": "missing",
            "base_url": "https://missing.example",
            "api_base_url": "https://api.missing.example",
            "auth_profile": None,
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}
