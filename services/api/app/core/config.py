import json
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://testops:testops@localhost:5432/testops"
    redis_url: str = "redis://localhost:6379/0"
    cursor_agent_command: str = "cursor-agent"
    cursor_agent_timeout_seconds: int = 120
    cursor_agent_cwd: str | None = None
    codex_failure_analysis_model: str = "codex-provider-boundary"
    lark_webhook_url: str | None = None
    runner_framework: str = "playwright"
    runner_language: str = "typescript"
    runner_pattern: str = "pom"
    runner_reporter: str = "allure-playwright"
    artifact_storage_root: str = "var/artifacts"
    document_storage_path: str = "data/documents"
    runtime_settings_path: str = "var/runtime-settings.json"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


def _apply_runtime_overrides(target: Settings) -> None:
    path = Path(target.runtime_settings_path)
    if not path.is_file():
        return

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return

    if not isinstance(payload, dict):
        return

    cursor = payload.get("cursor", {})
    if isinstance(cursor, dict):
        if isinstance(cursor.get("command"), str):
            target.cursor_agent_command = cursor["command"]
        if isinstance(cursor.get("timeout_seconds"), int):
            target.cursor_agent_timeout_seconds = cursor["timeout_seconds"]
        if "cwd" in cursor:
            target.cursor_agent_cwd = (
                str(cursor["cwd"]) if cursor.get("cwd") is not None else None
            )

    codex = payload.get("codex", {})
    if isinstance(codex, dict) and isinstance(codex.get("failure_analysis_model"), str):
        target.codex_failure_analysis_model = codex["failure_analysis_model"]

    runner = payload.get("runner", {})
    if isinstance(runner, dict):
        for key in ("framework", "language", "pattern", "reporter"):
            value = runner.get(key)
            if isinstance(value, str):
                setattr(target, f"runner_{key}", value)

    storage = payload.get("storage", {})
    if isinstance(storage, dict):
        if isinstance(storage.get("artifact_root"), str):
            target.artifact_storage_root = storage["artifact_root"]
        if isinstance(storage.get("document_root"), str):
            target.document_storage_path = storage["document_root"]


settings = Settings()
_apply_runtime_overrides(settings)
