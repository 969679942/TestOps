from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.data_setup import service as data_setup_service
from app.schemas.data_setup import (
    DataSetupExecutionCreate,
    DataSetupExecutionRead,
    DataSetupHintCreate,
    DataSetupHintRead,
)

router = APIRouter(tags=["data-setup"])


@router.post(
    "/test-cases/{test_case_id}/data-setup-hints",
    response_model=DataSetupHintRead,
    status_code=status.HTTP_201_CREATED,
)
def create_data_setup_hint(
    test_case_id: int,
    payload: DataSetupHintCreate,
    session: Session = Depends(get_session),
) -> DataSetupHintRead:
    return data_setup_service.create_hint(session, test_case_id, payload)


@router.get(
    "/test-cases/{test_case_id}/data-setup-hints",
    response_model=list[DataSetupHintRead],
)
def list_test_case_data_setup_hints(
    test_case_id: int,
    session: Session = Depends(get_session),
) -> list[DataSetupHintRead]:
    return data_setup_service.list_test_case_hints(session, test_case_id)


@router.get(
    "/projects/{project_id}/data-setup-hints",
    response_model=list[DataSetupHintRead],
)
def list_project_data_setup_hints(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[DataSetupHintRead]:
    return data_setup_service.list_project_hints(session, project_id)


@router.post(
    "/automation-runs/{run_id}/data-setup-executions",
    response_model=DataSetupExecutionRead,
    status_code=status.HTTP_201_CREATED,
)
def execute_data_setup_hint(
    run_id: int,
    payload: DataSetupExecutionCreate,
    session: Session = Depends(get_session),
) -> DataSetupExecutionRead:
    return data_setup_service.execute_hint(session, run_id, payload)


@router.get(
    "/automation-runs/{run_id}/data-setup-executions",
    response_model=list[DataSetupExecutionRead],
)
def list_automation_run_data_setup_executions(
    run_id: int,
    session: Session = Depends(get_session),
) -> list[DataSetupExecutionRead]:
    return data_setup_service.list_run_executions(session, run_id)


@router.get(
    "/projects/{project_id}/data-setup-executions",
    response_model=list[DataSetupExecutionRead],
)
def list_project_data_setup_executions(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[DataSetupExecutionRead]:
    return data_setup_service.list_project_executions(session, project_id)
