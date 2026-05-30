from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.document import service as document_service
from app.schemas.document import (
    DocumentCreate,
    DocumentRead,
    DocumentVersionCreate,
    DocumentVersionRead,
)

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


@router.post(
    "/documents/{document_id}/versions",
    response_model=DocumentVersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_document_version(
    document_id: int,
    payload: DocumentVersionCreate,
    session: Session = Depends(get_session),
) -> DocumentVersionRead:
    return document_service.create_version(session, document_id, payload)


@router.get(
    "/documents/{document_id}/versions",
    response_model=list[DocumentVersionRead],
)
def list_document_versions(
    document_id: int,
    session: Session = Depends(get_session),
) -> list[DocumentVersionRead]:
    return document_service.list_versions(session, document_id)


@router.post(
    "/document-versions/{version_id}/parse",
    response_model=DocumentVersionRead,
)
def parse_document_version(
    version_id: int,
    session: Session = Depends(get_session),
) -> DocumentVersionRead:
    return document_service.trigger_parse_version(session, version_id)
