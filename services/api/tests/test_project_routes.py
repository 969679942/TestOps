import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.core.database import get_session
from app.main import app


def test_client_uses_migrated_test_database(client, test_database_url):
    import sqlite3

    with sqlite3.connect(test_database_url.removeprefix("sqlite:///")) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }

    assert "alembic_version" in tables
    assert "projects" in tables
    assert "document_assets" in tables


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


def test_list_projects_returns_created_projects(client):
    client.post("/projects", json={"name": "Core Banking", "code": "core-banking"})
    client.post("/projects", json={"name": "Retail Banking", "code": "retail-banking"})

    response = client.get("/projects")

    assert response.status_code == 200
    assert [project["code"] for project in response.json()] == [
        "core-banking",
        "retail-banking",
    ]


def test_get_project_returns_existing_project(client):
    created_project = client.post(
        "/projects",
        json={"name": "Core Banking", "code": "core-banking"},
    ).json()

    response = client.get(f"/projects/{created_project['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == created_project["id"]
    assert response.json()["code"] == "core-banking"


def test_get_project_returns_404_for_missing_project(client):
    response = client.get("/projects/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"


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


def test_create_project_maps_commit_time_duplicate_integrity_error_to_conflict():
    class DuplicateCommitSession:
        def __init__(self) -> None:
            self.rolled_back = False

        def scalar(self, _query):
            return None

        def add(self, _project) -> None:
            pass

        def commit(self) -> None:
            raise IntegrityError(
                "insert",
                {},
                Exception(
                    'duplicate key value violates unique constraint "projects_code_key"'
                ),
            )

        def rollback(self) -> None:
            self.rolled_back = True

    session = DuplicateCommitSession()

    def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    try:
        with TestClient(app, raise_server_exceptions=False) as test_client:
            response = test_client.post(
                "/projects",
                json={"name": "Core Banking", "code": "core-banking"},
            )
    finally:
        app.dependency_overrides.clear()

    assert session.rolled_back is True
    assert response.status_code == 409


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
