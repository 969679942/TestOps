from pydantic import BaseModel


class CursorSettingsRead(BaseModel):
    command: str
    timeout_seconds: int
    cwd: str | None


class CodexSettingsRead(BaseModel):
    failure_analysis_model: str


class NotificationSettingsRead(BaseModel):
    lark_webhook_configured: bool


class RunnerSettingsRead(BaseModel):
    framework: str
    language: str
    pattern: str
    reporter: str


class RuntimeSettingsRead(BaseModel):
    cursor: CursorSettingsRead
    codex: CodexSettingsRead
    notifications: NotificationSettingsRead
    runner: RunnerSettingsRead
