from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class DataSetupHint(Base):
    __tablename__ = "data_setup_hints"

    id: Mapped[int] = mapped_column(primary_key=True)
    test_case_id: Mapped[int] = mapped_column(ForeignKey("test_cases.id"), nullable=False)
    document_version_id: Mapped[int] = mapped_column(
        ForeignKey("document_versions.id"),
        nullable=False,
    )
    environment_id: Mapped[int] = mapped_column(ForeignKey("environments.id"), nullable=False)
    endpoint: Mapped[str] = mapped_column(Text(), nullable=False)
    method: Mapped[str] = mapped_column(String(16), nullable=False)
    request_template: Mapped[dict[str, Any]] = mapped_column(
        JSON(),
        default=dict,
        nullable=False,
    )
    purpose: Mapped[str] = mapped_column(Text(), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float(), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )


class DataSetupExecution(Base):
    __tablename__ = "data_setup_executions"

    id: Mapped[int] = mapped_column(primary_key=True)
    data_setup_hint_id: Mapped[int] = mapped_column(
        ForeignKey("data_setup_hints.id"),
        nullable=False,
    )
    automation_run_id: Mapped[int] = mapped_column(
        ForeignKey("automation_runs.id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False)
    request_summary: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    response_summary: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
