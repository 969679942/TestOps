"""add test case ui_context

Revision ID: 0016_add_test_case_ui_context
Revises: 0015_add_final_reports
Create Date: 2026-05-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0016_add_test_case_ui_context"
down_revision: str | None = "0015_add_final_reports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("test_cases", sa.Column("ui_context", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("test_cases", "ui_context")
