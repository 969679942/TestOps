from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    description: Mapped[str | None] = mapped_column(Text())
    status: Mapped[str] = mapped_column(String(32), default="active")
    default_provider: Mapped[str] = mapped_column(String(32), default="cursor")
    default_prompt_profile: Mapped[str] = mapped_column(String(64), default="default")
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
    )
