from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class AutomationGenerationCreate(BaseModel):
    framework: Literal["playwright"] = "playwright"
    language: Literal["typescript"] = "typescript"
    pattern: Literal["pom"] = "pom"


class AutomationGenerationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_case_id: int
    status: str
    framework: str
    language: str
    pattern: str
    artifact_root: str | None
    artifact_paths: dict[str, Any]
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None
