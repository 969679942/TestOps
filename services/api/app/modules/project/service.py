from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate


class ProjectConflictError(Exception):
    pass


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
    session.commit()
    session.refresh(project)
    return project
