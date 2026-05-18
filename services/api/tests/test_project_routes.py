def test_create_project(client):
    response = client.post(
        "/projects",
        json={"name": "Core Banking", "code": "core-banking"},
    )

    assert response.status_code == 201
    assert response.json()["code"] == "core-banking"
