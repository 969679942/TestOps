from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AutomationReportCreate(BaseModel):
    kind: str = "allure"
    artifact_root: str
    index_path: str
    summary: dict[str, Any] = Field(default_factory=dict)


class AutomationReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    automation_run_id: int
    kind: str
    artifact_root: str
    index_path: str
    summary: dict[str, Any]
    created_at: datetime
