from __future__ import annotations

from datetime import datetime
from typing import Any, Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ProjectSkillBindingCreate(BaseModel):
    global_skill_id: int
    global_skill_version_id: int | None = None
    binding_type: NonEmptyStr = "primary"
    is_default: bool = False
    override_payload: dict[str, Any] = Field(default_factory=dict)


class ProjectSkillBindingUpdate(BaseModel):
    global_skill_version_id: int | None = None
    binding_type: NonEmptyStr | None = None
    is_default: bool | None = None
    status: NonEmptyStr | None = None
    override_payload: dict[str, Any] | None = None


class ProjectSkillBindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    global_skill_id: int
    global_skill_version_id: int
    binding_type: str
    status: str
    is_default: bool
    override_payload: dict[str, Any]
    skill_key: str
    skill_name: str
    version_label: str
    version_status: str
    skill_category: str
    skill_domain: str
    input_types: list[str]
    created_at: datetime
    updated_at: datetime
