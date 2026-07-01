"""repair document schema drift

Revision ID: 0020_repair_document_schema
Revises: 0019_add_skill_packages
Create Date: 2026-06-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0020_repair_document_schema"
down_revision: str | None = "0019_add_skill_packages"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("document_assets"):
        document_asset_columns = {
            column["name"] for column in inspector.get_columns("document_assets")
        }
        if "parse_status" not in document_asset_columns:
            with op.batch_alter_table("document_assets") as batch_op:
                batch_op.add_column(
                    sa.Column(
                        "parse_status",
                        sa.String(length=32),
                        nullable=False,
                        server_default="uploaded",
                    )
                )

    if not inspector.has_table("document_versions"):
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
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("document_versions"):
        op.drop_table("document_versions")

    if inspector.has_table("document_assets"):
        document_asset_columns = {
            column["name"] for column in inspector.get_columns("document_assets")
        }
        if "parse_status" in document_asset_columns:
            with op.batch_alter_table("document_assets") as batch_op:
                batch_op.drop_column("parse_status")
