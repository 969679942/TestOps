"""add project skill bindings

Revision ID: 0024_add_project_skill_bindings
Revises: 0023_add_global_skill_library
Create Date: 2026-06-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0024_add_project_skill_bindings"
down_revision: str | None = "0023_add_global_skill_library"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "project_skill_bindings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column(
            "global_skill_id",
            sa.Integer(),
            sa.ForeignKey("global_skill_definitions.id"),
            nullable=False,
        ),
        sa.Column(
            "global_skill_version_id",
            sa.Integer(),
            sa.ForeignKey("global_skill_versions.id"),
            nullable=False,
        ),
        sa.Column("binding_type", sa.String(length=32), nullable=False, server_default="primary"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("override_payload", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("project_skill_bindings")
