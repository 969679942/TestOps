"""add data setup

Revision ID: 0011_add_data_setup
Revises: 0010_add_environments
Create Date: 2026-05-21 14:45:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0011_add_data_setup"
down_revision: str | None = "0010_add_environments"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "data_setup_hints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("test_case_id", sa.Integer(), sa.ForeignKey("test_cases.id"), nullable=False),
        sa.Column(
            "document_version_id",
            sa.Integer(),
            sa.ForeignKey("document_versions.id"),
            nullable=False,
        ),
        sa.Column("environment_id", sa.Integer(), sa.ForeignKey("environments.id"), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=False),
        sa.Column("request_template", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="ready"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "data_setup_executions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "data_setup_hint_id",
            sa.Integer(),
            sa.ForeignKey("data_setup_hints.id"),
            nullable=False,
        ),
        sa.Column(
            "automation_run_id",
            sa.Integer(),
            sa.ForeignKey("automation_runs.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column("request_summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("response_summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("data_setup_executions")
    op.drop_table("data_setup_hints")
