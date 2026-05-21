"""add automation failure analyses

Revision ID: 0009_add_automation_failure_analyses
Revises: 0008_add_automation_runs
Create Date: 2026-05-21 08:10:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0009_add_automation_failure_analyses"
down_revision: str | None = "0008_add_automation_runs"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_failure_analyses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "automation_run_id",
            sa.Integer(),
            sa.ForeignKey("automation_runs.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="completed"),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="codex"),
        sa.Column(
            "model",
            sa.String(length=64),
            nullable=False,
            server_default="codex-placeholder",
        ),
        sa.Column("classification", sa.String(length=64), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("recommendations", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("should_rerun", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("automation_failure_analyses")
