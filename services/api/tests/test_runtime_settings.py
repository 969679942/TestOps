from __future__ import annotations


def test_runtime_settings_exposes_safe_platform_configuration(client, monkeypatch):
    from app.modules.settings import service as settings_service

    monkeypatch.setattr(settings_service.settings, "cursor_agent_command", "cursor-agent")
    monkeypatch.setattr(settings_service.settings, "cursor_agent_timeout_seconds", 180)
    monkeypatch.setattr(settings_service.settings, "cursor_agent_cwd", "D:/TestOps")
    monkeypatch.setattr(
        settings_service.settings,
        "codex_failure_analysis_model",
        "codex-provider-boundary",
    )
    monkeypatch.setattr(settings_service.settings, "lark_webhook_url", None)

    response = client.get("/settings/runtime")

    assert response.status_code == 200
    body = response.json()
    assert body["cursor"]["command"] == "cursor-agent"
    assert body["cursor"]["timeout_seconds"] == 180
    assert body["cursor"]["cwd"] == "D:/TestOps"
    assert body["codex"]["failure_analysis_model"] == "codex-provider-boundary"
    assert body["notifications"]["lark_webhook_configured"] is False
    assert body["runner"]["framework"] == "playwright"
    assert body["runner"]["language"] == "typescript"
    assert body["runner"]["pattern"] == "pom"
    assert body["runner"]["reporter"] == "allure-playwright"
