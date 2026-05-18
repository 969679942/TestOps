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
