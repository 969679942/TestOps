from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.report import service as report_service
from app.schemas.report import AutomationReportCreate, AutomationReportRead

router = APIRouter(tags=["reports"])


@router.post(
    "/automation-runs/{run_id}/reports",
    response_model=AutomationReportRead,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_report(
    run_id: int,
    payload: AutomationReportCreate,
    session: Session = Depends(get_session),
) -> AutomationReportRead:
    return report_service.create_report(session, run_id, payload)


@router.get(
    "/projects/{project_id}/automation-reports",
    response_model=list[AutomationReportRead],
)
def list_project_automation_reports(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[AutomationReportRead]:
    return report_service.list_project_reports(session, project_id)
