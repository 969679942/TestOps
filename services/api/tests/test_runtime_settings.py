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
    monkeypatch.setattr(settings_service.settings, "artifact_storage_root", "var/artifacts")
    monkeypatch.setattr(settings_service.settings, "document_storage_path", "data/documents")

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
    assert body["storage"]["artifact_root"] == "var/artifacts"
    assert body["storage"]["document_root"] == "data/documents"


def test_runtime_settings_can_be_updated_and_persisted(client, monkeypatch, tmp_path):
    from app.modules.settings import service as settings_service

    settings_path = tmp_path / "runtime-settings.json"
    monkeypatch.setattr(settings_service.settings, "runtime_settings_path", str(settings_path))

    response = client.put(
        "/settings/runtime",
        json={
            "cursor": {
                "command": "cursor-custom",
                "timeout_seconds": 240,
                "cwd": "D:/Menusifu/TestOps",
            },
            "codex": {
                "failure_analysis_model": "codex-latest",
            },
            "runner": {
                "framework": "playwright",
                "language": "typescript",
                "pattern": "screenplay",
                "reporter": "html",
            },
            "storage": {
                "artifact_root": "var/test-artifacts",
                "document_root": "var/test-documents",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["cursor"]["command"] == "cursor-custom"
    assert body["cursor"]["timeout_seconds"] == 240
    assert body["codex"]["failure_analysis_model"] == "codex-latest"
    assert body["runner"]["pattern"] == "screenplay"
    assert body["storage"]["artifact_root"] == "var/test-artifacts"
    assert settings_path.exists() is True
