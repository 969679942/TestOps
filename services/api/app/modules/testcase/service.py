from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.modules.project import service as project_service
from app.models.testcase import TestCase, TestCaseReview
from app.models.testcase_directory import TestCaseDirectory
from app.modules.review import service as review_service
from app.schemas.testcase_directory import TestCaseDirectoryCreate, TestCaseDirectoryRead
from app.schemas.testcase import TestCaseCreate, TestCaseUpdate

REVIEW_QUEUE_STATUSES = ("draft", "needs_update", "approved")


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


def _get_directory_or_404(
    session: Session,
    project_id: int,
    directory_id: int,
) -> TestCaseDirectory:
    directory = session.scalar(
        select(TestCaseDirectory).where(
            TestCaseDirectory.id == directory_id,
            TestCaseDirectory.project_id == project_id,
        )
    )
    if directory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case directory not found",
        )
    return directory


def _validate_directory(
    session: Session,
    project_id: int,
    directory_id: int | None,
) -> TestCaseDirectory | None:
    if directory_id is None:
        return None
    return _get_directory_or_404(session, project_id, directory_id)


def _directory_scope_ids(
    session: Session,
    project_id: int,
    directory_id: int,
) -> list[int]:
    directory = _get_directory_or_404(session, project_id, directory_id)
    if directory.parent_id is not None:
        return [directory.id]

    child_ids = list(
        session.scalars(
            select(TestCaseDirectory.id).where(
                TestCaseDirectory.project_id == project_id,
                TestCaseDirectory.parent_id == directory.id,
            )
        )
    )
    return [directory.id, *child_ids]


def create_test_case_directory(
    session: Session,
    project_id: int,
    payload: TestCaseDirectoryCreate,
) -> TestCaseDirectory:
    project_service.ensure_project_is_active(_get_project_or_404(session, project_id))

    parent: TestCaseDirectory | None = None
    if payload.parent_id is not None:
        parent = session.scalar(
            select(TestCaseDirectory).where(
                TestCaseDirectory.id == payload.parent_id,
                TestCaseDirectory.project_id == project_id,
            )
        )
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case directory not found",
            )
        if parent.parent_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only two directory levels are supported.",
            )

    directory = TestCaseDirectory(
        project_id=project_id,
        name=payload.name,
        parent_id=parent.id if parent else None,
    )
    session.add(directory)
    session.commit()
    session.refresh(directory)
    return directory


def list_test_case_directories(session: Session, project_id: int) -> list[TestCaseDirectoryRead]:
    _get_project_or_404(session, project_id)
    directories = list(
        session.scalars(
            select(TestCaseDirectory)
            .where(TestCaseDirectory.project_id == project_id)
            .order_by(TestCaseDirectory.parent_id.nullsfirst(), TestCaseDirectory.order_index, TestCaseDirectory.id)
        )
    )

    children_by_parent: dict[int, list[TestCaseDirectoryRead]] = {}
    roots: list[TestCaseDirectoryRead] = []

    for directory in directories:
        node = TestCaseDirectoryRead(
            id=directory.id,
            project_id=directory.project_id,
            name=directory.name,
            parent_id=directory.parent_id,
            children=[],
        )
        if directory.parent_id is None:
            roots.append(node)
        else:
            children_by_parent.setdefault(directory.parent_id, []).append(node)

    for root in roots:
        root.children = children_by_parent.get(root.id, [])

    return roots


def create_test_case(
    session: Session,
    project_id: int,
    payload: TestCaseCreate,
) -> TestCase:
    project_service.ensure_project_is_active(_get_project_or_404(session, project_id))
    directory = _validate_directory(session, project_id, payload.directory_id)

    test_case = TestCase(
        project_id=project_id,
        directory_id=directory.id if directory else None,
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
        ui_context=payload.ui_context.model_dump() if payload.ui_context else None,
        linked_requirement=payload.linked_requirement,
        source_refs=list(payload.source_refs),
        generation_task_id=payload.generation_task_id,
        status=payload.status,
    )
    session.add(test_case)
    session.commit()
    session.refresh(test_case)
    return test_case


def import_test_cases(
    session: Session,
    project_id: int,
    cases: list[TestCaseCreate],
) -> list[TestCase]:
    project_service.ensure_project_is_active(_get_project_or_404(session, project_id))

    created_cases: list[TestCase] = []
    for payload in cases:
        directory = _validate_directory(session, project_id, payload.directory_id)
        test_case = TestCase(
            project_id=project_id,
            directory_id=directory.id if directory else None,
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
            ui_context=payload.ui_context.model_dump() if payload.ui_context else None,
            linked_requirement=payload.linked_requirement,
            source_refs=list(payload.source_refs),
            generation_task_id=payload.generation_task_id,
            status=payload.status,
        )
        session.add(test_case)
        created_cases.append(test_case)

    session.commit()
    for test_case in created_cases:
        session.refresh(test_case)
    return created_cases


def list_test_cases(
    session: Session,
    project_id: int,
    directory_id: int | None = None,
) -> list[TestCase]:
    _get_project_or_404(session, project_id)
    statement = select(TestCase).where(TestCase.project_id == project_id)
    if directory_id is not None:
        scope_ids = _directory_scope_ids(session, project_id, directory_id)
        statement = statement.where(TestCase.directory_id.in_(scope_ids))
    cases = session.scalars(statement.order_by(TestCase.id))
    return list(cases)


def update_test_case(
    session: Session,
    test_case_id: int,
    payload: TestCaseUpdate,
) -> TestCase:
    test_case = get_test_case_or_404(session, test_case_id)
    project_service.ensure_project_is_active(_get_project_or_404(session, test_case.project_id))
    if test_case.status == "published":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Published test cases cannot be edited",
        )

    updates = payload.model_dump(exclude_unset=True)
    if "steps" in updates and updates["steps"] is not None:
        updates["steps"] = [step.model_dump() for step in payload.steps or []]
    if "expected_results" in updates and updates["expected_results"] is not None:
        updates["expected_results"] = [
            item.model_dump() for item in payload.expected_results or []
        ]
    if "preconditions" in updates and updates["preconditions"] is not None:
        updates["preconditions"] = list(payload.preconditions or [])
    if "tags" in updates and updates["tags"] is not None:
        updates["tags"] = list(payload.tags or [])
    if "ui_context" in updates and payload.ui_context is not None:
        updates["ui_context"] = payload.ui_context.model_dump()
    if "source_refs" in updates and updates["source_refs"] is not None:
        updates["source_refs"] = list(payload.source_refs or [])
    if "directory_id" in updates:
        directory = _validate_directory(session, test_case.project_id, payload.directory_id)
        updates["directory_id"] = directory.id if directory else None

    for field, value in updates.items():
        setattr(test_case, field, value)

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
