from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    directory_id: Mapped[int | None] = mapped_column(
        ForeignKey("test_case_directories.id"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    module: Mapped[str] = mapped_column(String(120), nullable=False)
    feature: Mapped[str] = mapped_column(String(120), nullable=False)
    case_type: Mapped[str] = mapped_column(String(64), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), nullable=False)
    preconditions: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    steps: Mapped[list[dict[str, Any]]] = mapped_column(JSON(), default=list, nullable=False)
    expected_results: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON(),
        default=list,
        nullable=False,
    )
    tags: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    automation_flag: Mapped[bool] = mapped_column(default=False, nullable=False)
    automation_notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ui_context: Mapped[dict[str, Any] | None] = mapped_column(JSON(), nullable=True)
    linked_requirement: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_refs: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON(),
        default=list,
        nullable=False,
    )
    generation_task_id: Mapped[int | None] = mapped_column(
        ForeignKey("generation_tasks.id"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )


class TestCaseReview(Base):
    __tablename__ = "test_case_reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    test_case_id: Mapped[int] = mapped_column(
        ForeignKey("test_cases.id"),
        nullable=False,
    )
    reviewer_id: Mapped[str] = mapped_column(String(120), nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
