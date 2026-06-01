from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.testcase import NonEmptyStr


class TestCaseDirectoryCreate(BaseModel):
    name: NonEmptyStr
    parent_id: int | None = None


class TestCaseDirectoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    parent_id: int | None
    children: list["TestCaseDirectoryRead"] = Field(default_factory=list)


TestCaseDirectoryRead.model_rebuild()
