from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.sql import Select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.document import DocumentAsset
from app.models.project import Project
from app.models.testcase import TestCase
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectStatus,
    ProjectStatusFilter,
    ProjectSummaryRead,
)

_VALID_PROJECT_STATUSES = {"active", "archived"}


class ProjectConflictError(Exception):
    pass


def _is_project_uniqueness_error(error: IntegrityError) -> bool:
    constraint_name = getattr(getattr(error.orig, "diag", None), "constraint_name", None)
    if constraint_name in {"projects_name_key", "projects_code_key"}:
        return True

    error_message = str(error.orig).lower()
    if "unique constraint failed" in error_message:
        return "projects.name" in error_message or "projects.code" in error_message

    if "duplicate key value violates unique constraint" in error_message:
        return "projects_name_key" in error_message or "projects_code_key" in error_message

    return False


def _apply_project_status_filter(
    statement: Select[tuple[Project]],
    status_filter: ProjectStatusFilter,
) -> Select[tuple[Project]]:
    if status_filter == "all":
        return statement
    return statement.where(Project.status == status_filter)


def _normalize_project_status_value(status_value: str | None) -> ProjectStatus:
    if status_value in _VALID_PROJECT_STATUSES:
        return status_value
    return "active"


def _build_project_read(project: Project) -> ProjectRead:
    return ProjectRead(
        id=project.id,
        name=project.name,
        code=project.code,
        description=project.description,
        status=_normalize_project_status_value(project.status),
        default_provider=project.default_provider,
        default_prompt_profile=project.default_prompt_profile,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _get_project_model(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def list_projects(
    session: Session,
    *,
    status_filter: ProjectStatusFilter = "active",
) -> list[ProjectRead]:
    statement = _apply_project_status_filter(
        select(Project).order_by(Project.id),
        status_filter,
    )
    return [_build_project_read(project) for project in session.scalars(statement)]


def list_project_summaries(
    session: Session,
    *,
    status_filter: ProjectStatusFilter = "active",
) -> list[ProjectSummaryRead]:
    statement = _apply_project_status_filter(
        select(Project).order_by(Project.id),
        status_filter,
    )
    projects = list(session.scalars(statement))
    summaries: list[ProjectSummaryRead] = []
    for project in projects:
        document_count = session.scalar(
            select(func.count())
            .select_from(DocumentAsset)
            .where(DocumentAsset.project_id == project.id)
        )
        test_case_count = session.scalar(
            select(func.count())
            .select_from(TestCase)
            .where(TestCase.project_id == project.id)
        )
        published_count = session.scalar(
            select(func.count())
            .select_from(TestCase)
            .where(
                TestCase.project_id == project.id,
                TestCase.status == "published",
            )
        )
        summaries.append(
            ProjectSummaryRead(
                id=project.id,
                name=project.name,
                code=project.code,
                description=project.description,
                status=_normalize_project_status_value(project.status),
                default_provider=project.default_provider,
                default_prompt_profile=project.default_prompt_profile,
                created_at=project.created_at,
                updated_at=project.updated_at,
                document_count=int(document_count or 0),
                test_case_count=int(test_case_count or 0),
                published_count=int(published_count or 0),
            )
        )
    return summaries


def get_project(session: Session, project_id: int) -> ProjectRead:
    project = _get_project_model(session, project_id)
    return _build_project_read(project)


def update_project_status(
    session: Session,
    project_id: int,
    status_value: ProjectStatus,
) -> Project:
    project = _get_project_model(session, project_id)
    project.status = status_value
    session.commit()
    session.refresh(project)
    return project


def create_project(session: Session, payload: ProjectCreate) -> Project:
    existing_project = session.scalar(
        select(Project).where(
            or_(Project.name == payload.name, Project.code == payload.code)
        )
    )
    if existing_project is not None:
        raise ProjectConflictError

    project = Project(
        name=payload.name,
        code=payload.code,
        description=payload.description,
    )
    session.add(project)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if _is_project_uniqueness_error(exc):
            raise ProjectConflictError from exc
        raise
    session.refresh(project)
    return project
