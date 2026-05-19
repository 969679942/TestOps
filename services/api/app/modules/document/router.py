from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.document import service as document_service
from app.schemas.document import DocumentCreate, DocumentRead

router = APIRouter(tags=["documents"])


@router.get("/projects/{project_id}/documents", response_model=list[DocumentRead])
def list_document_assets(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[DocumentRead]:
    return document_service.list_assets(session, project_id)


@router.post(
    "/projects/{project_id}/documents",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_document_asset(
    project_id: int,
    payload: DocumentCreate,
    session: Session = Depends(get_session),
) -> DocumentRead:
    return document_service.create_asset(session, project_id, payload)
