from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    type: str
    name: str
    source_mode: str
    source_uri: str | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    type: str
    name: str
    source_mode: str
    source_uri: str | None
