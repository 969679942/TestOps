from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
ReviewAction = Literal["comment", "request_change", "approve", "reject", "publish"]
PublicReviewAction = Literal["comment", "request_change", "approve", "reject"]


class ReviewCreate(BaseModel):
    reviewer_id: NonEmptyStr
    action: PublicReviewAction
    comment: str | None = None


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_case_id: int
    reviewer_id: str
    action: ReviewAction
    comment: str | None
    created_at: datetime
