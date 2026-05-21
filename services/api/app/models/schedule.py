from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class AutomationSchedule(Base):
    __tablename__ = "automation_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    environment_id: Mapped[int] = mapped_column(ForeignKey("environments.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    target_generation_ids: Mapped[list[int]] = mapped_column(
        JSON(),
        default=list,
        nullable=False,
    )
    cron_expression: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
