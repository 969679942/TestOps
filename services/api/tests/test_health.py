def test_healthcheck(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "schema": {
            "current_revision": "0024_add_project_skill_bindings",
            "head_revision": "0024_add_project_skill_bindings",
            "up_to_date": True,
            "drift_issues": [],
        },
    }
