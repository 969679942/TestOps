import pytest


def test_create_project(client):
    response = client.post(
        "/projects",
        json={
            "name": "Core Banking",
            "code": "core-banking",
            "description": "Main banking workflows",
        },
    )

    assert response.status_code == 201
    assert response.json()["code"] == "core-banking"
    assert response.json()["description"] == "Main banking workflows"


def test_create_project_rejects_duplicate_code(client):
    first_response = client.post(
        "/projects",
        json={"name": "Core Banking", "code": "core-banking"},
    )
    second_response = client.post(
        "/projects",
        json={"name": "Retail Banking", "code": "core-banking"},
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


@pytest.mark.parametrize(
    ("field", "value"),
    [("name", " "), ("code", " ")],
)
def test_create_project_rejects_blank_required_fields(client, field, value):
    payload = {
        "name": "Core Banking",
        "code": "core-banking",
        "description": "Main banking workflows",
    }
    payload[field] = value

    response = client.post("/projects", json=payload)

    assert response.status_code == 422
