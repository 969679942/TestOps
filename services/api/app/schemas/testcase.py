from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
TestCaseStatus = Literal["draft", "needs_update", "approved", "rejected", "published"]


class StepItem(BaseModel):
    text: NonEmptyStr


class TestCaseCreate(BaseModel):
    title: NonEmptyStr
    module: NonEmptyStr
    feature: NonEmptyStr
    case_type: NonEmptyStr
    priority: NonEmptyStr
    preconditions: list[NonEmptyStr] = Field(default_factory=list)
    steps: list[StepItem] = Field(min_length=1)
    expected_results: list[StepItem] = Field(min_length=1)
    tags: list[NonEmptyStr] = Field(default_factory=list)
    automation_flag: bool = False
    automation_notes: str | None = None
    status: Literal["draft"] = "draft"


class TestCaseUpdate(BaseModel):
    title: NonEmptyStr
    module: NonEmptyStr
    feature: NonEmptyStr
    case_type: NonEmptyStr
    priority: NonEmptyStr
    preconditions: list[NonEmptyStr] = Field(default_factory=list)
    steps: list[StepItem] = Field(min_length=1)
    expected_results: list[StepItem] = Field(min_length=1)
    tags: list[NonEmptyStr] = Field(default_factory=list)
    automation_flag: bool = False
    automation_notes: str | None = None


class TestCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    module: str
    feature: str
    case_type: str
    priority: str
    preconditions: list[str]
    steps: list[StepItem]
    expected_results: list[StepItem]
    tags: list[str]
    automation_flag: bool
    automation_notes: str | None
    status: TestCaseStatus
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None
