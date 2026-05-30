from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AutomationScheduleCreate(BaseModel):
    name: str
    environment_id: int
    target_generation_ids: list[int] = Field(min_length=1)
    cron_expression: str
    status: Literal["active", "paused"] = "active"
    next_run_at: datetime | None = None


class AutomationScheduleUpdate(BaseModel):
    name: str | None = None
    environment_id: int | None = None
    target_generation_ids: list[int] | None = None
    cron_expression: str | None = None
    status: Literal["active", "paused", "archived"] | None = None
    next_run_at: datetime | None = None


class AutomationScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    environment_id: int
    name: str
    target_generation_ids: list[int]
    cron_expression: str
    status: str
    next_run_at: datetime | None
    last_run_at: datetime | None
    created_at: datetime
    updated_at: datetime
