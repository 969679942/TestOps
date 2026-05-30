"""add document parse status

Revision ID: 0005_add_document_parse_status
Revises: 0004_add_test_cases_and_reviews
Create Date: 2026-05-19 23:45:00
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0005_add_document_parse_status"
down_revision: str | None = "0004_add_test_cases_and_reviews"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "document_assets",
        sa.Column(
            "parse_status",
            sa.String(length=32),
            nullable=False,
            server_default="uploaded",
        ),
    )


def downgrade() -> None:
    op.drop_column("document_assets", "parse_status")
