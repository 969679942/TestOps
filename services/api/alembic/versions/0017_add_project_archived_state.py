"""normalize project status default

Revision ID: 0017_add_project_archived_state
Revises: 0016_add_test_case_ui_context
Create Date: 2026-05-31
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0017_add_project_archived_state"
down_revision: str | None = "0016_add_test_case_ui_context"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "UPDATE projects SET status = 'active' "
            "WHERE status IS NULL "
            "OR TRIM(status) = '' "
            "OR status NOT IN ('active', 'archived')"
        )
    )
    with op.batch_alter_table("projects") as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=32),
            existing_nullable=False,
            server_default=sa.text("'active'"),
        )


def downgrade() -> None:
    with op.batch_alter_table("projects") as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=32),
            existing_nullable=False,
            server_default=None,
        )
