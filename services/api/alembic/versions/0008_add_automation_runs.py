"""add automation runs

Revision ID: 0008_add_automation_runs
Revises: 0007_add_automation_generations
Create Date: 2026-05-20 21:45:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0008_add_automation_runs"
down_revision: str | None = "0007_add_automation_generations"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "automation_generation_id",
            sa.Integer(),
            sa.ForeignKey("automation_generations.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column(
            "trigger_mode",
            sa.String(length=32),
            nullable=False,
            server_default="manual",
        ),
        sa.Column("report_path", sa.Text(), nullable=True),
        sa.Column("summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("automation_runs")
