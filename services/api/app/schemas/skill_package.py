from __future__ import annotations

from datetime import datetime
from typing import Any, Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class SkillPackageCreate(BaseModel):
    system_key: NonEmptyStr
    name: NonEmptyStr


class SkillPackageVersionCreate(BaseModel):
    summary: str | None = None
    storage_uri: str | None = None
    template_key: str | None = None
    content: dict[str, Any] = Field(default_factory=dict)


class SkillPackageVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_package_id: int
    version_no: int
    storage_uri: str | None
    structured_metadata: dict[str, Any]
    summary: str | None
    created_at: datetime


class SkillPackageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    system_key: str
    name: str
    status: str
    active_version_id: int | None
    active_version_summary: str | None = None
    created_at: datetime
    updated_at: datetime


class GlobalSkillDefinitionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_key: str
    name: str
    description: str
    category: str
    domain: str
    input_types: list[str]
    status: str
    owner: str
    current_production_version_id: int | None = None
    current_production_version_label: str | None = None
    created_at: datetime
    updated_at: datetime


class GlobalSkillDefinitionCreate(BaseModel):
    skill_key: NonEmptyStr
    name: NonEmptyStr
    description: NonEmptyStr
    category: NonEmptyStr
    domain: NonEmptyStr
    input_types: list[NonEmptyStr] = Field(default_factory=list)
    owner: NonEmptyStr = "workspace"


class GlobalSkillDefinitionUpdate(BaseModel):
    name: NonEmptyStr | None = None
    description: NonEmptyStr | None = None
    category: NonEmptyStr | None = None
    domain: NonEmptyStr | None = None
    input_types: list[NonEmptyStr] | None = None
    status: NonEmptyStr | None = None
    owner: NonEmptyStr | None = None


class GlobalSkillVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    global_skill_id: int
    version_no: int
    version_label: str
    status: str
    prompt_template: str
    scenario_taxonomy: list[str]
    review_checklist: list[str]
    coverage_dimensions: list[str]
    evidence_policy: str
    storage_uri: str | None
    change_log: str | None
    release_notes: str | None
    created_by: str
    created_at: datetime
    published_at: datetime | None


class GlobalSkillVersionCreate(BaseModel):
    version_label: NonEmptyStr
    prompt_template: NonEmptyStr
    scenario_taxonomy: list[NonEmptyStr] = Field(default_factory=list)
    review_checklist: list[NonEmptyStr] = Field(default_factory=list)
    coverage_dimensions: list[NonEmptyStr] = Field(default_factory=list)
    evidence_policy: NonEmptyStr
    storage_uri: str | None = None
    change_log: str | None = None
    release_notes: str | None = None
    created_by: NonEmptyStr = "workspace"
    status: NonEmptyStr = "draft"


class GlobalSkillVersionUpdate(BaseModel):
    version_label: NonEmptyStr | None = None
    prompt_template: NonEmptyStr | None = None
    scenario_taxonomy: list[NonEmptyStr] | None = None
    review_checklist: list[NonEmptyStr] | None = None
    coverage_dimensions: list[NonEmptyStr] | None = None
    evidence_policy: NonEmptyStr | None = None
    storage_uri: str | None = None
    change_log: str | None = None
    release_notes: str | None = None
    created_by: NonEmptyStr | None = None
    status: NonEmptyStr | None = None
