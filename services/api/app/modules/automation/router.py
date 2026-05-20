from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.automation import service as automation_service
from app.schemas.automation import (
    AutomationGenerationCreate,
    AutomationGenerationRead,
    AutomationRunCreate,
    AutomationRunRead,
)

router = APIRouter(tags=["automation"])


@router.get(
    "/projects/{project_id}/automation-generations",
    response_model=list[AutomationGenerationRead],
)
def list_project_automation_generations(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[AutomationGenerationRead]:
    return automation_service.list_project_generations(session, project_id)


@router.get(
    "/projects/{project_id}/automation-runs",
    response_model=list[AutomationRunRead],
)
def list_project_automation_runs(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[AutomationRunRead]:
    return automation_service.list_project_runs(session, project_id)


@router.post(
    "/test-cases/{test_case_id}/automation-generations",
    response_model=AutomationGenerationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_generation(
    test_case_id: int,
    payload: AutomationGenerationCreate | None = None,
    session: Session = Depends(get_session),
) -> AutomationGenerationRead:
    return automation_service.create_generation(
        session,
        test_case_id,
        payload or AutomationGenerationCreate(),
    )


@router.post(
    "/automation-generations/{generation_id}/runs",
    response_model=AutomationRunRead,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_run(
    generation_id: int,
    payload: AutomationRunCreate | None = None,
    session: Session = Depends(get_session),
) -> AutomationRunRead:
    return automation_service.create_run(
        session,
        generation_id,
        payload or AutomationRunCreate(),
    )
