import pytest

ARCHIVED_PROJECT_MESSAGE = "Project is archived. Restore it before making changes."


def _archive_project(client, project_id: int) -> None:
    response = client.patch(
        f"/projects/{project_id}/status",
        json={"status": "archived"},
    )

    assert response.status_code == 200


def test_create_document_asset(client):
    project = client.post("/projects", json={"name": "A", "code": "a"}).json()

    response = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "figma",
            "name": "Checkout UI",
            "source_mode": "external_link",
            "source_uri": "https://figma.com/file/abc",
        },
    )

    assert response.status_code == 201
    assert response.json()["type"] == "figma"
    assert response.json()["parse_status"] == "queued"


def test_create_document_asset_rejects_archived_project(client):
    project = client.post("/projects", json={"name": "A", "code": "a"}).json()
    _archive_project(client, project["id"])

    response = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "figma",
            "name": "Checkout UI",
            "source_mode": "external_link",
            "source_uri": "https://figma.com/file/abc",
        },
    )

    assert response.status_code == 409
    assert response.json() == {"detail": ARCHIVED_PROJECT_MESSAGE}


def test_upload_document_asset_rejects_archived_project(client):
    project = client.post("/projects", json={"name": "A2", "code": "a2"}).json()
    _archive_project(client, project["id"])

    response = client.post(
        f"/projects/{project['id']}/documents/upload",
        data={
            "type": "markdown",
            "name": "Archived upload",
            "source_mode": "upload",
        },
        files={"file": ("archived.md", b"# archived", "text/markdown")},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": ARCHIVED_PROJECT_MESSAGE}


def test_list_document_assets_returns_project_documents(client):
    project = client.post("/projects", json={"name": "A", "code": "a"}).json()

    first_document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "figma",
            "name": "Checkout UI",
            "source_mode": "external_link",
            "source_uri": "https://figma.com/file/abc",
        },
    )
    second_document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "swagger",
            "name": "Checkout API",
            "source_mode": "url",
            "source_uri": "https://example.test/swagger.json",
        },
    )

    response = client.get(f"/projects/{project['id']}/documents")

    assert first_document.status_code == 201
    assert second_document.status_code == 201
    assert response.status_code == 200
    assert [document["name"] for document in response.json()] == [
        "Checkout UI",
        "Checkout API",
    ]
    assert [document["parse_status"] for document in response.json()] == [
        "queued",
        "queued",
    ]


def test_list_document_assets_returns_404_for_missing_project(client):
    response = client.get("/projects/999/documents")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"


@pytest.mark.parametrize(
    ("field", "value"),
    [("type", " "), ("name", " "), ("source_mode", " ")],
)
def test_create_document_asset_rejects_blank_required_fields(client, field, value):
    project = client.post("/projects", json={"name": "A", "code": "a"}).json()
    payload = {
        "type": "figma",
        "name": "Checkout UI",
        "source_mode": "external_link",
        "source_uri": "https://figma.com/file/abc",
    }
    payload[field] = value

    response = client.post(f"/projects/{project['id']}/documents", json=payload)

    assert response.status_code == 422
