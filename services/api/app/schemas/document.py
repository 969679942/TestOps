from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator

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
    parse_status: str


class DocumentVersionCreate(BaseModel):
    filename: str | None = None
    content: str | None = None
    source_uri: str | None = None

    @model_validator(mode="after")
    def require_content_or_source(self) -> "DocumentVersionCreate":
        if not self.content and not self.source_uri:
            raise ValueError("Either content or source_uri is required.")
        return self


class DocumentVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_asset_id: int
    version_no: int
    storage_path: str | None
    checksum: str | None
    source_uri: str | None
    parse_status: str
    parse_summary: str | None
    structured_metadata: dict[str, Any]
