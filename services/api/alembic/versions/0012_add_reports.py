"""add reports

Revision ID: 0012_add_reports
Revises: 0011_add_data_setup
Create Date: 2026-05-21 20:05:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0012_add_reports"
down_revision: str | None = "0011_add_data_setup"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "automation_run_id",
            sa.Integer(),
            sa.ForeignKey("automation_runs.id"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("artifact_root", sa.Text(), nullable=False),
        sa.Column("index_path", sa.Text(), nullable=False),
        sa.Column("summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("automation_reports")
