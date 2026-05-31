from typing import Annotated, Literal
from datetime import datetime

from pydantic import BaseModel, ConfigDict, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
ProjectStatus = Literal["active", "archived"]
ProjectStatusFilter = Literal["active", "archived", "all"]


class ProjectCreate(BaseModel):
    name: NonEmptyStr
    code: NonEmptyStr
    description: str | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    description: str | None
    status: str
    default_provider: str
    default_prompt_profile: str
    created_at: datetime
    updated_at: datetime


class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus


class ProjectSummaryRead(ProjectRead):
    document_count: int
    test_case_count: int
    published_count: int
