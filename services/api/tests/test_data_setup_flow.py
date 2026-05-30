from app.modules.automation import service as automation_service
from app.modules.data_setup import service as data_setup_service


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


def _publish_test_case(client, test_case_id: int):
    approved = client.post(
        f"/test-cases/{test_case_id}/reviews",
        json={
            "reviewer_id": "qa.lead",
            "action": "approve",
            "comment": "ready",
        },
    )
    assert approved.status_code == 201
    published = client.post(f"/test-cases/{test_case_id}/publish")
    assert published.status_code == 200
    return published.json()


def _create_data_setup_hint(client, test_case_id: int, version_id: int, environment_id: int):
    response = client.post(
        f"/test-cases/{test_case_id}/data-setup-hints",
        json={
            "document_version_id": version_id,
            "environment_id": environment_id,
            "endpoint": "/orders",
            "method": "post",
            "request_template": {
                "customer_id": "{{customer_id}}",
                "secret_token": "{{api_token}}",
            },
            "purpose": "Create order data",
            "confidence_score": 0.86,
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


def test_execute_data_setup_hint_records_safe_summaries(
    client,
    monkeypatch,
    tmp_path,
):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    environment = _create_environment(client, project["id"])
    version = _create_swagger_version(client, project["id"])
    test_case = _publish_test_case(client, _create_test_case(client, project["id"])["id"])
    generation = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generation.status_code == 201
    run = client.post(f"/automation-generations/{generation.json()['id']}/runs")
    assert run.status_code == 201
    hint = _create_data_setup_hint(
        client,
        test_case["id"],
        version["id"],
        environment["id"],
    )
    calls = []

    class FakeResponse:
        status_code = 201

        def json(self):
            return {
                "id": "order-123",
                "secret_token": "should-not-be-stored",
            }

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def request(self, method, url, json):
            calls.append(
                {
                    "method": method,
                    "url": url,
                    "json": json,
                }
            )
            return FakeResponse()

    monkeypatch.setattr(data_setup_service.httpx, "Client", FakeClient)

    created = client.post(
        f"/automation-runs/{run.json()['id']}/data-setup-executions",
        json={
            "data_setup_hint_id": hint["id"],
            "variables": {
                "customer_id": "customer-1",
                "api_token": "top-secret",
            },
        },
    )

    assert created.status_code == 201
    body = created.json()
    assert body["data_setup_hint_id"] == hint["id"]
    assert body["automation_run_id"] == run.json()["id"]
    assert body["status"] == "completed"
    assert body["request_summary"] == {
        "method": "post",
        "url": "https://api-staging.checkout.example/orders",
        "body_keys": ["customer_id", "secret_token"],
    }
    assert body["response_summary"] == {
        "status_code": 201,
        "json_keys": ["id", "secret_token"],
    }
    assert body["completed_at"] is not None
    assert calls == [
        {
            "method": "post",
            "url": "https://api-staging.checkout.example/orders",
            "json": {
                "customer_id": "customer-1",
                "secret_token": "top-secret",
            },
        }
    ]

    listed = client.get(f"/automation-runs/{run.json()['id']}/data-setup-executions")
    assert listed.status_code == 200
    assert listed.json() == [body]

    by_project = client.get(f"/projects/{project['id']}/data-setup-executions")
    assert by_project.status_code == 200
    assert by_project.json() == [body]


def test_execute_data_setup_hint_rejects_unsafe_endpoint(client, monkeypatch, tmp_path):
    monkeypatch.setattr(automation_service.settings, "artifact_storage_root", str(tmp_path))
    project = _create_project(client)
    environment = _create_environment(client, project["id"])
    version = _create_swagger_version(client, project["id"])
    test_case = _publish_test_case(client, _create_test_case(client, project["id"])["id"])
    generation = client.post(f"/test-cases/{test_case['id']}/automation-generations")
    assert generation.status_code == 201
    run = client.post(f"/automation-generations/{generation.json()['id']}/runs")
    assert run.status_code == 201
    hint = client.post(
        f"/test-cases/{test_case['id']}/data-setup-hints",
        json={
            "document_version_id": version["id"],
            "environment_id": environment["id"],
            "endpoint": "https://evil.example/orders",
            "method": "post",
            "request_template": {},
            "purpose": "Create unsafe order data",
            "confidence_score": 0.5,
        },
    )
    assert hint.status_code == 201

    response = client.post(
        f"/automation-runs/{run.json()['id']}/data-setup-executions",
        json={
            "data_setup_hint_id": hint.json()["id"],
            "variables": {},
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Data setup endpoint must be a relative API path"
    }
