"""add document versions

Revision ID: 0006_add_document_versions
Revises: 0005_add_document_parse_status
Create Date: 2026-05-20 10:30:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0006_add_document_versions"
down_revision: str | None = "0005_add_document_parse_status"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "document_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "document_asset_id",
            sa.Integer(),
            sa.ForeignKey("document_assets.id"),
            nullable=False,
        ),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.Text(), nullable=True),
        sa.Column("checksum", sa.String(length=64), nullable=True),
        sa.Column("source_uri", sa.Text(), nullable=True),
        sa.Column(
            "parse_status",
            sa.String(length=32),
            nullable=False,
            server_default="uploaded",
        ),
        sa.Column("parse_summary", sa.Text(), nullable=True),
        sa.Column("structured_metadata", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("document_versions")
