from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class DocumentAsset(Base):
    __tablename__ = "document_assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    type: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(255))
    source_mode: Mapped[str] = mapped_column(String(32))
    source_uri: Mapped[str | None] = mapped_column(Text())
    parse_status: Mapped[str] = mapped_column(String(32), default="uploaded")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_asset_id: Mapped[int] = mapped_column(ForeignKey("document_assets.id"))
    version_no: Mapped[int] = mapped_column()
    storage_path: Mapped[str | None] = mapped_column(Text(), nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_uri: Mapped[str | None] = mapped_column(Text(), nullable=True)
    parse_status: Mapped[str] = mapped_column(String(32), default="uploaded")
    parse_summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    structured_metadata: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow)
