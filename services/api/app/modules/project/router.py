from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.project import service as project_service
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectStatusFilter,
    ProjectStatusUpdate,
    ProjectSummaryRead,
)

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=list[ProjectRead])
def list_projects(
    status: ProjectStatusFilter = Query(default="active"),
    session: Session = Depends(get_session),
) -> list[ProjectRead]:
    return project_service.list_projects(session, status_filter=status)


@router.get("/project-summaries", response_model=list[ProjectSummaryRead])
def list_project_summaries(
    status: ProjectStatusFilter = Query(default="active"),
    session: Session = Depends(get_session),
) -> list[ProjectSummaryRead]:
    return project_service.list_project_summaries(session, status_filter=status)


@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    session: Session = Depends(get_session),
) -> ProjectRead:
    try:
        return project_service.create_project(session, payload)
    except project_service.ProjectConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project with this name or code already exists",
        ) from exc


@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, session: Session = Depends(get_session)) -> ProjectRead:
    return project_service.get_project(session, project_id)


@router.patch("/projects/{project_id}/status", response_model=ProjectRead)
def update_project_status(
    project_id: int,
    payload: ProjectStatusUpdate,
    session: Session = Depends(get_session),
) -> ProjectRead:
    return project_service.update_project_status(session, project_id, payload.status)
