from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.automation import service as automation_service
from app.schemas.automation import AutomationGenerationCreate, AutomationGenerationRead

router = APIRouter(tags=["automation"])


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
