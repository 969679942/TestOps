from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.generation import service as generation_service
from app.schemas.generation import GenerationTaskCreate, GenerationTaskRead

router = APIRouter(tags=["generation"])


@router.get(
    "/projects/{project_id}/generation-tasks",
    response_model=list[GenerationTaskRead],
)
def list_generation_tasks(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[GenerationTaskRead]:
    return generation_service.list_tasks(session, project_id)


@router.post(
    "/projects/{project_id}/generation-tasks",
    response_model=GenerationTaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_generation_task(
    project_id: int,
    payload: GenerationTaskCreate,
    session: Session = Depends(get_session),
) -> GenerationTaskRead:
    task = generation_service.create_task(session, project_id, payload)

    if task.provider == "mock":
        return generation_service.execute_generation_task(session, task.id)

    dispatch_issue = generation_service.dispatch_generation_task(task.id)
    if dispatch_issue:
        task = generation_service.record_dispatch_issue(session, task, dispatch_issue)
    return task


@router.get("/generation-tasks/{task_id}", response_model=GenerationTaskRead)
def get_generation_task(
    task_id: int,
    session: Session = Depends(get_session),
) -> GenerationTaskRead:
    return generation_service.get_task(session, task_id)
