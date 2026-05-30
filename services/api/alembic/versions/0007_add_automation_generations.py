"""add automation generations

Revision ID: 0007_add_automation_generations
Revises: 0006_add_document_versions
Create Date: 2026-05-20 20:05:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0007_add_automation_generations"
down_revision: str | None = "0006_add_document_versions"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "automation_generations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "test_case_id",
            sa.Integer(),
            sa.ForeignKey("test_cases.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column("framework", sa.String(length=32), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=False),
        sa.Column("pattern", sa.String(length=32), nullable=False),
        sa.Column("artifact_root", sa.Text(), nullable=True),
        sa.Column("artifact_paths", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("automation_generations")
