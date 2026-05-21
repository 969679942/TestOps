from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.environment import Environment
from app.models.project import Project
from app.schemas.environment import EnvironmentCreate, EnvironmentUpdate


def _get_project(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def _get_environment(session: Session, environment_id: int) -> Environment:
    environment = session.scalar(
        select(Environment).where(Environment.id == environment_id)
    )
    if environment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found",
        )
    return environment


def create_environment(
    session: Session,
    project_id: int,
    payload: EnvironmentCreate,
) -> Environment:
    _get_project(session, project_id)
    environment = Environment(
        project_id=project_id,
        name=payload.name,
        code=payload.code,
        base_url=payload.base_url,
        api_base_url=payload.api_base_url,
        auth_profile=payload.auth_profile,
        status="active",
    )
    session.add(environment)
    session.commit()
    session.refresh(environment)
    return environment


def list_project_environments(
    session: Session,
    project_id: int,
) -> list[Environment]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(Environment)
            .where(Environment.project_id == project_id)
            .order_by(Environment.id)
        )
    )


def update_environment(
    session: Session,
    environment_id: int,
    payload: EnvironmentUpdate,
) -> Environment:
    environment = _get_environment(session, environment_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(environment, key, value)

    session.add(environment)
    session.commit()
    session.refresh(environment)
    return environment
