import pytest


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
