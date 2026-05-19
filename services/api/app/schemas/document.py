from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class DocumentCreate(BaseModel):
    type: NonEmptyStr
    name: NonEmptyStr
    source_mode: NonEmptyStr
    source_uri: str | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    type: str
    name: str
    source_mode: str
    source_uri: str | None
