from typing import Annotated
from datetime import datetime

from pydantic import BaseModel, ConfigDict, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


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


class ProjectSummaryRead(ProjectRead):
    document_count: int
    test_case_count: int
    published_count: int
