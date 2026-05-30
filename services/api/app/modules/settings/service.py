from app.core.config import settings
from app.schemas.settings import (
    CodexSettingsRead,
    CursorSettingsRead,
    NotificationSettingsRead,
    RunnerSettingsRead,
    RuntimeSettingsRead,
)


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
            framework="playwright",
            language="typescript",
            pattern="pom",
            reporter="allure-playwright",
        ),
    )
