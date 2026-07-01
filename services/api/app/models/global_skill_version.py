from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class GlobalSkillVersion(Base):
    __tablename__ = "global_skill_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    global_skill_id: Mapped[int] = mapped_column(
        ForeignKey("global_skill_definitions.id"),
        nullable=False,
    )
    version_no: Mapped[int] = mapped_column(Integer(), nullable=False)
    version_label: Mapped[str] = mapped_column(Text(), nullable=False)
    status: Mapped[str] = mapped_column(Text(), default="production", nullable=False)
    prompt_template: Mapped[str] = mapped_column(Text(), nullable=False)
    scenario_taxonomy: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    review_checklist: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    coverage_dimensions: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    evidence_policy: Mapped[str] = mapped_column(Text(), nullable=False)
    storage_uri: Mapped[str | None] = mapped_column(Text(), nullable=True)
    change_log: Mapped[str | None] = mapped_column(Text(), nullable=True)
    release_notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_by: Mapped[str] = mapped_column(Text(), default="system", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
