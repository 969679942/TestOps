from __future__ import annotations

import json
from pathlib import Path

from app.core.config import settings
from app.schemas.settings import (
    CodexSettingsRead,
    RuntimeSettingsUpdate,
    CursorSettingsRead,
    NotificationSettingsRead,
    RunnerSettingsRead,
    RuntimeSettingsRead,
    StorageSettingsRead,
)


def _settings_file() -> Path:
    path = Path(settings.runtime_settings_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _runtime_payload() -> dict[str, object]:
    return {
        "cursor": {
            "command": settings.cursor_agent_command,
            "timeout_seconds": settings.cursor_agent_timeout_seconds,
            "cwd": settings.cursor_agent_cwd,
        },
        "codex": {
            "failure_analysis_model": settings.codex_failure_analysis_model,
        },
        "runner": {
            "framework": getattr(settings, "runner_framework", "playwright"),
            "language": getattr(settings, "runner_language", "typescript"),
            "pattern": getattr(settings, "runner_pattern", "pom"),
            "reporter": getattr(settings, "runner_reporter", "allure-playwright"),
        },
        "storage": {
            "artifact_root": settings.artifact_storage_root,
            "document_root": settings.document_storage_path,
        },
    }


def get_runtime_settings() -> RuntimeSettingsRead:
    return RuntimeSettingsRead(
        cursor=CursorSettingsRead(
            command=settings.cursor_agent_command,
            timeout_seconds=settings.cursor_agent_timeout_seconds,
            cwd=settings.cursor_agent_cwd,
        ),
        codex=CodexSettingsRead(
            failure_analysis_model=settings.codex_failure_analysis_model,
        ),
        notifications=NotificationSettingsRead(
            lark_webhook_configured=bool(settings.lark_webhook_url),
        ),
        runner=RunnerSettingsRead(
            framework=getattr(settings, "runner_framework", "playwright"),
            language=getattr(settings, "runner_language", "typescript"),
            pattern=getattr(settings, "runner_pattern", "pom"),
            reporter=getattr(settings, "runner_reporter", "allure-playwright"),
        ),
        storage=StorageSettingsRead(
            artifact_root=settings.artifact_storage_root,
            document_root=settings.document_storage_path,
        ),
    )


def update_runtime_settings(payload: RuntimeSettingsUpdate) -> RuntimeSettingsRead:
    settings.cursor_agent_command = payload.cursor.command
    settings.cursor_agent_timeout_seconds = payload.cursor.timeout_seconds
    settings.cursor_agent_cwd = payload.cursor.cwd
    settings.codex_failure_analysis_model = payload.codex.failure_analysis_model
    settings.runner_framework = payload.runner.framework
    settings.runner_language = payload.runner.language
    settings.runner_pattern = payload.runner.pattern
    settings.runner_reporter = payload.runner.reporter
    settings.artifact_storage_root = payload.storage.artifact_root
    settings.document_storage_path = payload.storage.document_root

    _settings_file().write_text(
        json.dumps(_runtime_payload(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return get_runtime_settings()
