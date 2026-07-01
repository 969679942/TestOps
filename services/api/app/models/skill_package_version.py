from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class SkillPackageVersion(Base):
    __tablename__ = "skill_package_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_package_id: Mapped[int] = mapped_column(
        ForeignKey("skill_packages.id"),
        nullable=False,
    )
    version_no: Mapped[int] = mapped_column(Integer(), nullable=False)
    storage_uri: Mapped[str | None] = mapped_column(Text(), nullable=True)
    structured_metadata: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
