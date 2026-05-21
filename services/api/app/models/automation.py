from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class AutomationGeneration(Base):
    __tablename__ = "automation_generations"

    id: Mapped[int] = mapped_column(primary_key=True)
    test_case_id: Mapped[int] = mapped_column(ForeignKey("test_cases.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False)
    framework: Mapped[str] = mapped_column(String(32), nullable=False)
    language: Mapped[str] = mapped_column(String(32), nullable=False)
    pattern: Mapped[str] = mapped_column(String(32), nullable=False)
    artifact_root: Mapped[str | None] = mapped_column(Text(), nullable=True)
    artifact_paths: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    automation_generation_id: Mapped[int] = mapped_column(
        ForeignKey("automation_generations.id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False)
    trigger_mode: Mapped[str] = mapped_column(String(32), default="manual", nullable=False)
    report_path: Mapped[str | None] = mapped_column(Text(), nullable=True)
    summary: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)


class AutomationFailureAnalysis(Base):
    __tablename__ = "automation_failure_analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    automation_run_id: Mapped[int] = mapped_column(
        ForeignKey("automation_runs.id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), default="completed", nullable=False)
    provider: Mapped[str] = mapped_column(String(32), default="codex", nullable=False)
    model: Mapped[str] = mapped_column(String(64), default="codex-placeholder", nullable=False)
    classification: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[float] = mapped_column(Float(), nullable=False)
    summary: Mapped[str] = mapped_column(Text(), nullable=False)
    recommendations: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    should_rerun: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
