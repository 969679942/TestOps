from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate


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
