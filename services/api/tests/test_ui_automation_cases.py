def test_import_ui_automation_cases(client):
    project = client.post(
        "/projects",
        json={"name": "UI Automation", "code": "ui-auto"},
    ).json()

    response = client.post(
        f"/projects/{project['id']}/test-cases/import",
        json={
            "cases": [
                {
                    "title": "登录并进入首页",
                    "module": "认证",
                    "feature": "登录",
                    "case_type": "ui_automation",
                    "priority": "high",
                    "automation_flag": True,
                    "ui_context": {
                        "framework": "playwright",
                        "base_url": "https://app.example.com",
                        "entry_path": "/login",
                        "test_data": {"username": "qa@example.com"},
                    },
                    "steps": [
                        {
                            "action": "navigate",
                            "target": "登录页",
                            "value": "/login",
                            "locator_hint": "path:/login",
                        },
                        {
                            "action": "fill",
                            "target": "用户名",
                            "value": "{{test_data.username}}",
                            "locator_hint": "[data-testid='username']",
                        },
                    ],
                    "expected_results": [{"text": "进入首页"}],
                }
            ]
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body[0]["case_type"] == "ui_automation"
    assert body[0]["ui_context"]["framework"] == "playwright"
    assert body[0]["steps"][0]["action"] == "navigate"
    assert "登录页" in body[0]["steps"][0]["text"]


def test_create_ui_automation_case(client):
    project = client.post(
        "/projects",
        json={"name": "Compose UI", "code": "compose-ui"},
    ).json()

    response = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "在线编写用例",
            "module": "订单",
            "feature": "下单",
            "case_type": "ui_automation",
            "priority": "medium",
            "steps": [{"text": "点击提交订单"}],
            "expected_results": [{"text": "订单创建成功"}],
            "automation_flag": True,
            "ui_context": {
                "base_url": "https://shop.example.com",
                "entry_path": "/checkout",
            },
        },
    )

    assert response.status_code == 201
    assert response.json()["ui_context"]["entry_path"] == "/checkout"
