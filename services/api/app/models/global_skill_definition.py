from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class GlobalSkillDefinition(Base):
    __tablename__ = "global_skill_definitions"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    domain: Mapped[str] = mapped_column(String(64), nullable=False)
    input_types: Mapped[list[str]] = mapped_column(JSON(), default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    owner: Mapped[str] = mapped_column(String(64), default="system", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
