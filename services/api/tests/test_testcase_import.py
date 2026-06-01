def test_import_test_cases(client):
    project = client.post(
        "/projects",
        json={"name": "Import UI", "code": "import-ui"},
    ).json()
    root = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "测试特性目录", "parent_id": None},
    ).json()
    child = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "登录", "parent_id": root["id"]},
    ).json()

    response = client.post(
        f"/projects/{project['id']}/test-cases/import",
        json={
            "cases": [
                {
                    "title": "Login with valid credentials",
                    "module": "Auth",
                    "feature": "Sign in",
                    "case_type": "functional",
                    "priority": "high",
                    "preconditions": ["User account exists"],
                    "steps": [
                        {"text": "Open the login page"},
                        {"text": "Submit valid username and password"},
                    ],
                    "expected_results": [
                        {"text": "Login form is displayed"},
                        {"text": "User lands on the dashboard"},
                    ],
                    "tags": ["smoke"],
                    "automation_flag": True,
                    "directory_id": child["id"],
                },
                {
                    "title": "Reject invalid password",
                    "module": "Auth",
                    "feature": "Sign in",
                    "case_type": "functional",
                    "priority": "medium",
                    "preconditions": [],
                    "steps": [{"text": "Submit an invalid password"}],
                    "expected_results": [{"text": "An inline error is shown"}],
                    "tags": ["negative"],
                },
            ]
        },
    )
    listed = client.get(f"/projects/{project['id']}/test-cases")

    assert response.status_code == 201
    assert len(response.json()) == 2
    assert response.json()[0]["title"] == "Login with valid credentials"
    assert response.json()[0]["directory_id"] == child["id"]
    assert listed.status_code == 200
    assert len(listed.json()) == 2
