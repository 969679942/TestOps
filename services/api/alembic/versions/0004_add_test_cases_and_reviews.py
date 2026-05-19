"""add test cases and reviews

Revision ID: 0004_add_test_cases_and_reviews
Revises: 0003_add_generation_tasks
Create Date: 2026-05-19 20:45:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0004_add_test_cases_and_reviews"
down_revision: str | None = "0003_add_generation_tasks"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "test_cases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("module", sa.String(length=120), nullable=False),
        sa.Column("feature", sa.String(length=120), nullable=False),
        sa.Column("case_type", sa.String(length=64), nullable=False),
        sa.Column("priority", sa.String(length=32), nullable=False),
        sa.Column("preconditions", sa.JSON(), nullable=False),
        sa.Column("steps", sa.JSON(), nullable=False),
        sa.Column("expected_results", sa.JSON(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("automation_flag", sa.Boolean(), nullable=False),
        sa.Column("automation_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "test_case_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("test_case_id", sa.Integer(), sa.ForeignKey("test_cases.id"), nullable=False),
        sa.Column("reviewer_id", sa.String(length=120), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("test_case_reviews")
    op.drop_table("test_cases")
