from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class AutomationReport(Base):
    __tablename__ = "automation_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    automation_run_id: Mapped[int] = mapped_column(
        ForeignKey("automation_runs.id"),
        nullable=False,
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    artifact_root: Mapped[str] = mapped_column(Text(), nullable=False)
    index_path: Mapped[str] = mapped_column(Text(), nullable=False)
    summary: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)


class AutomationFinalReport(Base):
    __tablename__ = "automation_final_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    automation_run_id: Mapped[int] = mapped_column(
        ForeignKey("automation_runs.id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    lark_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    lark_error: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    pushed_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
