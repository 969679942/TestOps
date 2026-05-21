from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class DataSetupHintCreate(BaseModel):
    document_version_id: int
    environment_id: int
    endpoint: NonEmptyStr
    method: NonEmptyStr
    request_template: dict[str, Any] = Field(default_factory=dict)
    purpose: NonEmptyStr
    confidence_score: float = Field(ge=0, le=1)


class DataSetupHintRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_case_id: int
    document_version_id: int
    environment_id: int
    endpoint: str
    method: str
    request_template: dict[str, Any]
    purpose: str
    confidence_score: float
    status: str
    created_at: datetime
    updated_at: datetime
