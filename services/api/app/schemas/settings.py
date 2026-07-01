from pydantic import BaseModel


class CursorSettingsRead(BaseModel):
    command: str
    timeout_seconds: int
    cwd: str | None


class CursorSettingsUpdate(CursorSettingsRead):
    pass


class CodexSettingsRead(BaseModel):
    failure_analysis_model: str


class CodexSettingsUpdate(CodexSettingsRead):
    pass


class NotificationSettingsRead(BaseModel):
    lark_webhook_configured: bool


class RunnerSettingsRead(BaseModel):
    framework: str
    language: str
    pattern: str
    reporter: str


class RunnerSettingsUpdate(RunnerSettingsRead):
    pass


class StorageSettingsRead(BaseModel):
    artifact_root: str
    document_root: str


class StorageSettingsUpdate(StorageSettingsRead):
    pass


class RuntimeSettingsRead(BaseModel):
    cursor: CursorSettingsRead
    codex: CodexSettingsRead
    notifications: NotificationSettingsRead
    runner: RunnerSettingsRead
    storage: StorageSettingsRead


class RuntimeSettingsUpdate(BaseModel):
    cursor: CursorSettingsUpdate
    codex: CodexSettingsUpdate
    runner: RunnerSettingsUpdate
    storage: StorageSettingsUpdate
