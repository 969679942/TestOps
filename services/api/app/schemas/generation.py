from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, PositiveInt, StringConstraints, field_validator

from app.modules.provider import PROVIDERS

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class GenerationTaskCreate(BaseModel):
    provider: str | None = None
    model: NonEmptyStr | None = None
    prompt_profile: NonEmptyStr | None = None
    input_document_ids: list[PositiveInt] = Field(default_factory=list)

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip().lower()
        if normalized not in PROVIDERS:
            supported = ", ".join(sorted(PROVIDERS))
            raise ValueError(f"Provider must be one of: {supported}")
        return normalized


class GenerationTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    status: str
    provider: str
    model: str
    prompt_version: str
    input_refs: dict[str, Any]
    started_at: datetime | None
    finished_at: datetime | None
    error_message: str | None
    created_at: datetime
