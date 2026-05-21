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


class AutomationRunCreate(BaseModel):
    trigger_mode: Literal["manual", "scheduled", "analysis_rerun"] = "manual"


class AutomationRunUpdate(BaseModel):
    status: Literal["queued", "running", "passed", "failed"]
    report_path: str | None = None
    summary: dict[str, Any] = {}
    error_message: str | None = None


class AutomationRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    automation_generation_id: int
    status: str
    trigger_mode: str
    report_path: str | None
    summary: dict[str, Any]
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class AutomationFailureAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    automation_run_id: int
    status: str
    provider: str
    model: str
    classification: str
    confidence: float
    summary: str
    recommendations: list[str]
    should_rerun: bool
    created_at: datetime
    completed_at: datetime | None
