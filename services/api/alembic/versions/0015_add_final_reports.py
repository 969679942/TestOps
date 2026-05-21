"""add final reports

Revision ID: 0015_add_final_reports
Revises: 0014_add_debug_proposals
Create Date: 2026-05-21 21:05:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0015_add_final_reports"
down_revision: str | None = "0014_add_debug_proposals"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_final_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column(
            "automation_run_id",
            sa.Integer(),
            sa.ForeignKey("automation_runs.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("summary", sa.JSON(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("lark_status", sa.String(length=32), nullable=False),
        sa.Column("lark_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("pushed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("automation_final_reports")
