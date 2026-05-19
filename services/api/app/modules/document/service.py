from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import DocumentAsset
from app.models.project import Project
from app.schemas.document import DocumentCreate


def _get_project(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def create_asset(session: Session, project_id: int, payload: DocumentCreate) -> DocumentAsset:
    _get_project(session, project_id)

    asset = DocumentAsset(
        project_id=project_id,
        type=payload.type,
        name=payload.name,
        source_mode=payload.source_mode,
        source_uri=payload.source_uri,
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset


def list_assets(session: Session, project_id: int) -> list[DocumentAsset]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(DocumentAsset)
            .where(DocumentAsset.project_id == project_id)
            .order_by(DocumentAsset.id)
        )
    )
