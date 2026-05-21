from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class EnvironmentCreate(BaseModel):
    name: NonEmptyStr
    code: NonEmptyStr
    base_url: NonEmptyStr
    api_base_url: NonEmptyStr
    auth_profile: str | None = None


class EnvironmentUpdate(BaseModel):
    name: NonEmptyStr | None = None
    base_url: NonEmptyStr | None = None
    api_base_url: NonEmptyStr | None = None
    auth_profile: str | None = None
    status: Literal["active", "paused", "archived"] | None = None


class EnvironmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    code: str
    base_url: str
    api_base_url: str
    auth_profile: str | None
    status: str
    created_at: datetime
    updated_at: datetime
