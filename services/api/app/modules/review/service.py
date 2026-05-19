from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.testcase import TestCase, TestCaseReview
from app.schemas.review import ReviewCreate


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def get_test_case_or_404(session: Session, test_case_id: int) -> TestCase:
    test_case = session.scalar(select(TestCase).where(TestCase.id == test_case_id))
    if test_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found",
        )
    return test_case


def apply_review_action(
    test_case: TestCase,
    review: TestCaseReview,
) -> None:
    if review.action == "comment":
        return
    if review.action == "request_change":
        test_case.status = "needs_update"
        test_case.published_at = None
        return
    if review.action == "approve":
        test_case.status = "approved"
        return
    if review.action == "reject":
        test_case.status = "rejected"
        test_case.published_at = None
        return
    if review.action == "publish":
        if test_case.status != "approved":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only approved cases can be published",
            )
        test_case.status = "published"
        test_case.published_at = _utcnow()
        return


def add_review(
    session: Session,
    test_case_id: int,
    payload: ReviewCreate,
) -> TestCaseReview:
    test_case = get_test_case_or_404(session, test_case_id)
    if test_case.status == "published":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Published test cases cannot be reviewed",
        )

    review = TestCaseReview(
        test_case_id=test_case.id,
        reviewer_id=payload.reviewer_id,
        action=payload.action,
        comment=payload.comment,
    )
    apply_review_action(test_case, review)

    session.add(review)
    session.add(test_case)
    session.commit()
    session.refresh(review)
    return review


def list_reviews(session: Session, test_case_id: int) -> list[TestCaseReview]:
    get_test_case_or_404(session, test_case_id)
    reviews = session.scalars(
        select(TestCaseReview)
        .where(TestCaseReview.test_case_id == test_case_id)
        .order_by(TestCaseReview.id)
    )
    return list(reviews)
