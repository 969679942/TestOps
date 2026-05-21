def _create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Checkout Data Setup",
            "code": "checkout-data-setup",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_environment(client, project_id: int):
    response = client.post(
        f"/projects/{project_id}/environments",
        json={
            "name": "Checkout Staging",
            "code": "staging",
            "base_url": "https://staging.checkout.example",
            "api_base_url": "https://api-staging.checkout.example",
            "auth_profile": "qa-staging",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_swagger_version(client, project_id: int):
    document = client.post(
        f"/projects/{project_id}/documents",
        json={
            "type": "swagger",
            "name": "Checkout API",
            "source_mode": "upload",
            "source_uri": None,
        },
    )
    assert document.status_code == 201
    version = client.post(
        f"/documents/{document.json()['id']}/versions",
        json={
            "filename": "swagger.json",
            "content": '{"openapi":"3.0.0","paths":{}}',
            "source_uri": None,
        },
    )
    assert version.status_code == 201
    return version.json()


def _create_test_case(client, project_id: int):
    response = client.post(
        f"/projects/{project_id}/test-cases",
        json={
            "title": "Submit a checkout order",
            "module": "Checkout",
            "feature": "Order submission",
            "case_type": "functional",
            "priority": "high",
            "preconditions": ["A cart exists"],
            "steps": [{"text": "Open checkout"}],
            "expected_results": [{"text": "Order is submitted"}],
            "tags": ["checkout"],
            "automation_flag": True,
            "automation_notes": "Create order data before UI run.",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_and_list_data_setup_hints(client):
    project = _create_project(client)
    environment = _create_environment(client, project["id"])
    version = _create_swagger_version(client, project["id"])
    test_case = _create_test_case(client, project["id"])

    created = client.post(
        f"/test-cases/{test_case['id']}/data-setup-hints",
        json={
            "document_version_id": version["id"],
            "environment_id": environment["id"],
            "endpoint": "/orders",
            "method": "post",
            "request_template": {
                "customer_id": "{{customer_id}}",
                "items": "{{cart_items}}",
            },
            "purpose": "Create an order fixture before checkout UI automation",
            "confidence_score": 0.86,
        },
    )

    assert created.status_code == 201
    hint = created.json()
    assert hint["test_case_id"] == test_case["id"]
    assert hint["document_version_id"] == version["id"]
    assert hint["environment_id"] == environment["id"]
    assert hint["endpoint"] == "/orders"
    assert hint["method"] == "post"
    assert hint["request_template"] == {
        "customer_id": "{{customer_id}}",
        "items": "{{cart_items}}",
    }
    assert hint["purpose"] == "Create an order fixture before checkout UI automation"
    assert hint["confidence_score"] == 0.86
    assert hint["status"] == "ready"

    by_case = client.get(f"/test-cases/{test_case['id']}/data-setup-hints")
    assert by_case.status_code == 200
    assert by_case.json() == [hint]

    by_project = client.get(f"/projects/{project['id']}/data-setup-hints")
    assert by_project.status_code == 200
    assert by_project.json() == [hint]


def test_create_data_setup_hint_rejects_cross_project_environment(client):
    project = _create_project(client)
    other_project = client.post(
        "/projects",
        json={
            "name": "Other System",
            "code": "other-system",
        },
    )
    assert other_project.status_code == 201
    environment = _create_environment(client, other_project.json()["id"])
    version = _create_swagger_version(client, project["id"])
    test_case = _create_test_case(client, project["id"])

    response = client.post(
        f"/test-cases/{test_case['id']}/data-setup-hints",
        json={
            "document_version_id": version["id"],
            "environment_id": environment["id"],
            "endpoint": "/orders",
            "method": "post",
            "request_template": {},
            "purpose": "Create order data",
            "confidence_score": 0.5,
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Data setup hint references must belong to the same project"
    }
