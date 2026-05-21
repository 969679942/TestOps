from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.schedule import service as schedule_service
from app.schemas.schedule import (
    AutomationScheduleCreate,
    AutomationScheduleRead,
    AutomationScheduleUpdate,
)

router = APIRouter(tags=["automation-schedules"])


@router.post(
    "/projects/{project_id}/automation-schedules",
    response_model=AutomationScheduleRead,
    status_code=status.HTTP_201_CREATED,
)
def create_project_automation_schedule(
    project_id: int,
    payload: AutomationScheduleCreate,
    session: Session = Depends(get_session),
) -> AutomationScheduleRead:
    return schedule_service.create_schedule(session, project_id, payload)


@router.get(
    "/projects/{project_id}/automation-schedules",
    response_model=list[AutomationScheduleRead],
)
def list_project_automation_schedules(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[AutomationScheduleRead]:
    return schedule_service.list_project_schedules(session, project_id)


@router.patch(
    "/automation-schedules/{schedule_id}",
    response_model=AutomationScheduleRead,
)
def update_automation_schedule(
    schedule_id: int,
    payload: AutomationScheduleUpdate,
    session: Session = Depends(get_session),
) -> AutomationScheduleRead:
    return schedule_service.update_schedule(session, schedule_id, payload)
