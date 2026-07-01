from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class ProjectSkillBinding(Base):
    __tablename__ = "project_skill_bindings"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    global_skill_id: Mapped[int] = mapped_column(
        ForeignKey("global_skill_definitions.id"), nullable=False
    )
    global_skill_version_id: Mapped[int] = mapped_column(
        ForeignKey("global_skill_versions.id"), nullable=False
    )
    binding_type: Mapped[str] = mapped_column(String(32), default="primary", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)
    override_payload: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
