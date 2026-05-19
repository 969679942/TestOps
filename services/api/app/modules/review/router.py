from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.review import service as review_service
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(tags=["reviews"])


@router.post(
    "/test-cases/{test_case_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def add_review(
    test_case_id: int,
    payload: ReviewCreate,
    session: Session = Depends(get_session),
) -> ReviewRead:
    return review_service.add_review(session, test_case_id, payload)


@router.get("/test-cases/{test_case_id}/reviews", response_model=list[ReviewRead])
def list_reviews(
    test_case_id: int,
    session: Session = Depends(get_session),
) -> list[ReviewRead]:
    return review_service.list_reviews(session, test_case_id)
