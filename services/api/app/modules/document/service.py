from hashlib import sha256
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import DocumentAsset, DocumentVersion
from app.models.project import Project
from app.modules.document.storage import LocalArtifactStorage
from app.schemas.document import DocumentCreate, DocumentVersionCreate


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


def _get_document_asset(session: Session, document_id: int) -> DocumentAsset:
    asset = session.get(DocumentAsset, document_id)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return asset


def _safe_filename(value: str | None, fallback: str) -> str:
    raw = (value or fallback).strip() or fallback
    return "".join(char if char.isalnum() or char in "._-" else "-" for char in raw)


def _next_version_no(session: Session, document_id: int) -> int:
    current = session.scalar(
        select(func.max(DocumentVersion.version_no)).where(
            DocumentVersion.document_asset_id == document_id
        )
    )
    return int(current or 0) + 1


def create_version(
    session: Session,
    document_id: int,
    payload: DocumentVersionCreate,
) -> DocumentVersion:
    asset = _get_document_asset(session, document_id)
    version_no = _next_version_no(session, document_id)
    storage_path: str | None = None
    checksum: str | None = None

    if payload.content is not None:
        content = payload.content.encode("utf-8")
        checksum = sha256(content).hexdigest()
        filename = _safe_filename(payload.filename, f"document-{document_id}.txt")
        relative_path = str(
            Path("projects")
            / str(asset.project_id)
            / "documents"
            / str(asset.id)
            / f"v{version_no}"
            / filename
        )
        storage = LocalArtifactStorage(Path(settings.artifact_storage_root))
        storage_path = storage.save_bytes(relative_path, content)

    version = DocumentVersion(
        document_asset_id=document_id,
        version_no=version_no,
        storage_path=storage_path,
        checksum=checksum,
        source_uri=payload.source_uri,
        parse_status="uploaded",
        structured_metadata={},
    )
    asset.parse_status = "uploaded"
    session.add(asset)
    session.add(version)
    session.commit()
    session.refresh(version)
    return version


def list_versions(session: Session, document_id: int) -> list[DocumentVersion]:
    _get_document_asset(session, document_id)
    return list(
        session.scalars(
            select(DocumentVersion)
            .where(DocumentVersion.document_asset_id == document_id)
            .order_by(DocumentVersion.version_no)
        )
    )


def trigger_parse_version(session: Session, version_id: int) -> DocumentVersion:
    version = session.get(DocumentVersion, version_id)
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document version not found",
        )

    version.parse_status = "queued"
    version.parse_summary = None
    session.add(version)
    session.commit()
    session.refresh(version)

    dispatch_issue = dispatch_parse_document_version(version.id)
    if dispatch_issue:
        version.parse_status = "failed"
        version.parse_summary = dispatch_issue
        session.add(version)
        session.commit()
        session.refresh(version)

    return version


def dispatch_parse_document_version(version_id: int) -> str | None:
    try:
        from celery import Celery
    except ModuleNotFoundError:
        return "Parse dispatch client is not installed in the API environment."

    try:
        from redis import Redis

        redis_client = Redis.from_url(
            settings.redis_url,
            socket_connect_timeout=0.2,
            socket_timeout=0.2,
        )
        redis_client.ping()
    except Exception as exc:  # pragma: no cover - depends on broker availability
        return f"Parse dispatch could not reach the broker: {exc}"

    client = Celery("testops_api", broker=settings.redis_url, backend=settings.redis_url)
    client.conf.update(
        broker_connection_retry=False,
        broker_connection_retry_on_startup=False,
        broker_connection_timeout=1,
        broker_transport_options={
            "socket_connect_timeout": 1,
            "socket_timeout": 1,
        },
    )
    try:
        client.send_task(
            "documents.parse_version",
            args=[version_id],
            retry=False,
        )
    except Exception as exc:  # pragma: no cover - depends on broker availability
        return f"Parse dispatch could not reach the broker: {exc}"
    return None


def list_assets(session: Session, project_id: int) -> list[DocumentAsset]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(DocumentAsset)
            .where(DocumentAsset.project_id == project_id)
            .order_by(DocumentAsset.id)
        )
    )
