"""add debug proposals

Revision ID: 0014_add_debug_proposals
Revises: 0013_add_schedules
Create Date: 2026-05-21 20:45:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0014_add_debug_proposals"
down_revision: str | None = "0013_add_schedules"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_debug_proposals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "automation_failure_analysis_id",
            sa.Integer(),
            sa.ForeignKey("automation_failure_analyses.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("proposal_type", sa.String(length=32), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("patch_proposal", sa.JSON(), nullable=False),
        sa.Column("recommendations", sa.JSON(), nullable=False),
        sa.Column("reviewer_id", sa.String(length=120), nullable=True),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("automation_debug_proposals")
