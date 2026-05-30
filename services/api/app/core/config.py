from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://testops:testops@localhost:5432/testops"
    redis_url: str = "redis://localhost:6379/0"
    cursor_agent_command: str = "cursor-agent"
    cursor_agent_timeout_seconds: int = 120
    cursor_agent_cwd: str | None = None
    codex_failure_analysis_model: str = "codex-provider-boundary"
    lark_webhook_url: str | None = None
    artifact_storage_root: str = "var/artifacts"
    document_storage_path: str = "data/documents"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
