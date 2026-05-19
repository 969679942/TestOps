from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.testcase import TestCase, TestCaseReview
from app.modules.review import service as review_service
from app.schemas.testcase import TestCaseCreate


def _get_project_or_404(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def get_test_case_or_404(session: Session, test_case_id: int) -> TestCase:
    return review_service.get_test_case_or_404(session, test_case_id)


def create_test_case(
    session: Session,
    project_id: int,
    payload: TestCaseCreate,
) -> TestCase:
    _get_project_or_404(session, project_id)

    test_case = TestCase(
        project_id=project_id,
        title=payload.title,
        module=payload.module,
        feature=payload.feature,
        case_type=payload.case_type,
        priority=payload.priority,
        preconditions=list(payload.preconditions),
        steps=[step.model_dump() for step in payload.steps],
        expected_results=[item.model_dump() for item in payload.expected_results],
        tags=list(payload.tags),
        automation_flag=payload.automation_flag,
        automation_notes=payload.automation_notes,
        status=payload.status,
    )
    session.add(test_case)
    session.commit()
    session.refresh(test_case)
    return test_case


def publish_case(session: Session, test_case_id: int) -> TestCase:
    test_case = get_test_case_or_404(session, test_case_id)
    publish_review = TestCaseReview(
        test_case_id=test_case.id,
        reviewer_id="system",
        action="publish",
        comment=None,
    )
    review_service.apply_review_action(test_case, publish_review)

    session.add(publish_review)
    session.add(test_case)
    session.commit()
    session.refresh(test_case)
    return test_case


def list_published_cases(session: Session, project_id: int) -> list[TestCase]:
    _get_project_or_404(session, project_id)
    published_cases = session.scalars(
        select(TestCase)
        .where(
            TestCase.project_id == project_id,
            TestCase.status == "published",
        )
        .order_by(TestCase.id)
    )
    return list(published_cases)
