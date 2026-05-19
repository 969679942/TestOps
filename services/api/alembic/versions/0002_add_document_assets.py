"""add document assets

Revision ID: 0002_add_document_assets
Revises: 0001_initial_schema
Create Date: 2026-05-19 00:30:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_add_document_assets"
down_revision: str | None = "0001_initial_schema"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "document_assets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("source_mode", sa.String(length=32), nullable=False),
        sa.Column("source_uri", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("document_assets")
