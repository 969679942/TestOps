"""add global skill library

Revision ID: 0023_add_global_skill_library
Revises: 0022_repair_auto_schema
Create Date: 2026-06-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0023_add_global_skill_library"
down_revision: str | None = "0022_repair_auto_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "global_skill_definitions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("skill_key", sa.String(length=64), nullable=False, unique=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("domain", sa.String(length=64), nullable=False),
        sa.Column("input_types", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("owner", sa.String(length=64), nullable=False, server_default="system"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "global_skill_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "global_skill_id",
            sa.Integer(),
            sa.ForeignKey("global_skill_definitions.id"),
            nullable=False,
        ),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("version_label", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="production"),
        sa.Column("prompt_template", sa.Text(), nullable=False),
        sa.Column("scenario_taxonomy", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("review_checklist", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("coverage_dimensions", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("evidence_policy", sa.Text(), nullable=False),
        sa.Column("storage_uri", sa.Text(), nullable=True),
        sa.Column("change_log", sa.Text(), nullable=True),
        sa.Column("release_notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Text(), nullable=False, server_default="system"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("global_skill_versions")
    op.drop_table("global_skill_definitions")
