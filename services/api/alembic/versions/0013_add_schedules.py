"""add automation schedules

Revision ID: 0013_add_schedules
Revises: 0012_add_reports
Create Date: 2026-05-21 20:25:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0013_add_schedules"
down_revision: str | None = "0012_add_reports"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_schedules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id"),
            nullable=False,
        ),
        sa.Column(
            "environment_id",
            sa.Integer(),
            sa.ForeignKey("environments.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("target_generation_ids", sa.JSON(), nullable=False),
        sa.Column("cron_expression", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("next_run_at", sa.DateTime(), nullable=True),
        sa.Column("last_run_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("automation_schedules")
