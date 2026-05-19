from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.testcase import TestCaseReview
from app.modules.testcase import service as testcase_service
from app.schemas.review import ReviewCreate


def add_review(
    session: Session,
    test_case_id: int,
    payload: ReviewCreate,
) -> TestCaseReview:
    test_case = testcase_service.get_test_case_or_404(session, test_case_id)
    review = TestCaseReview(
        test_case_id=test_case.id,
        reviewer_id=payload.reviewer_id,
        action=payload.action,
        comment=payload.comment,
    )

    if payload.action == "approve":
        test_case.status = "approved"
    elif payload.action == "request_changes":
        test_case.status = "draft"
        test_case.published_at = None

    session.add(review)
    session.add(test_case)
    session.commit()
    session.refresh(review)
    return review


def list_reviews(session: Session, test_case_id: int) -> list[TestCaseReview]:
    testcase_service.get_test_case_or_404(session, test_case_id)
    reviews = session.scalars(
        select(TestCaseReview)
        .where(TestCaseReview.test_case_id == test_case_id)
        .order_by(TestCaseReview.id)
    )
    return list(reviews)
