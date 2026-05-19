from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DocumentAsset(Base):
    __tablename__ = "document_assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    type: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(255))
    source_mode: Mapped[str] = mapped_column(String(32))
    source_uri: Mapped[str | None] = mapped_column(Text())
    parse_status: Mapped[str] = mapped_column(String(32), default="uploaded")
