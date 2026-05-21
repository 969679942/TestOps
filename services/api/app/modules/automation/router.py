from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.automation import service as automation_service
from app.schemas.automation import (
    AutomationFailureAnalysisRead,
    AutomationGenerationCreate,
    AutomationGenerationRead,
    AutomationRunCreate,
    AutomationRunRead,
    AutomationRunUpdate,
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


@router.get(
    "/projects/{project_id}/automation-failure-analyses",
    response_model=list[AutomationFailureAnalysisRead],
)
def list_project_automation_failure_analyses(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[AutomationFailureAnalysisRead]:
    return automation_service.list_project_failure_analyses(session, project_id)


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


@router.post(
    "/automation-runs/{run_id}/failure-analyses",
    response_model=AutomationFailureAnalysisRead,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_failure_analysis(
    run_id: int,
    session: Session = Depends(get_session),
) -> AutomationFailureAnalysisRead:
    return automation_service.create_failure_analysis(session, run_id)


@router.post(
    "/automation-failure-analyses/{analysis_id}/rerun",
    response_model=AutomationRunRead,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_rerun_from_analysis(
    analysis_id: int,
    session: Session = Depends(get_session),
) -> AutomationRunRead:
    return automation_service.create_rerun_from_analysis(session, analysis_id)


@router.patch(
    "/automation-runs/{run_id}",
    response_model=AutomationRunRead,
)
def update_automation_run(
    run_id: int,
    payload: AutomationRunUpdate,
    session: Session = Depends(get_session),
) -> AutomationRunRead:
    return automation_service.update_run(session, run_id, payload)
