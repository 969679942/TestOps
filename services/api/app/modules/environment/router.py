from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.environment import service as environment_service
from app.schemas.environment import (
    EnvironmentCreate,
    EnvironmentRead,
    EnvironmentUpdate,
)

router = APIRouter(tags=["environments"])


@router.post(
    "/projects/{project_id}/environments",
    response_model=EnvironmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_project_environment(
    project_id: int,
    payload: EnvironmentCreate,
    session: Session = Depends(get_session),
) -> EnvironmentRead:
    return environment_service.create_environment(session, project_id, payload)


@router.get(
    "/projects/{project_id}/environments",
    response_model=list[EnvironmentRead],
)
def list_project_environments(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[EnvironmentRead]:
    return environment_service.list_project_environments(session, project_id)


@router.patch(
    "/environments/{environment_id}",
    response_model=EnvironmentRead,
)
def update_project_environment(
    environment_id: int,
    payload: EnvironmentUpdate,
    session: Session = Depends(get_session),
) -> EnvironmentRead:
    return environment_service.update_environment(session, environment_id, payload)
