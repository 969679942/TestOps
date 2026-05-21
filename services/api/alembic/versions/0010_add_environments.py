"""add environments

Revision ID: 0010_add_environments
Revises: 0009_add_automation_failure_analyses
Create Date: 2026-05-21 13:55:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0010_add_environments"
down_revision: str | None = "0009_add_automation_failure_analyses"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "environments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("base_url", sa.Text(), nullable=False),
        sa.Column("api_base_url", sa.Text(), nullable=False),
        sa.Column("auth_profile", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("project_id", "code", name="environments_project_code_key"),
    )


def downgrade() -> None:
    op.drop_table("environments")
