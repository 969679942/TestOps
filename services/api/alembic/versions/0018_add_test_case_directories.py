"""add test case directories

Revision ID: 0018_add_test_case_directories
Revises: 0017_add_project_archived_state
Create Date: 2026-06-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0018_add_test_case_directories"
down_revision: str | None = "0017_add_project_archived_state"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "test_case_directories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("test_case_directories.id"), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    with op.batch_alter_table("test_cases") as batch_op:
        batch_op.add_column(sa.Column("directory_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_test_cases_directory_id",
            "test_case_directories",
            ["directory_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("test_cases") as batch_op:
        batch_op.drop_constraint("fk_test_cases_directory_id", type_="foreignkey")
        batch_op.drop_column("directory_id")
    op.drop_table("test_case_directories")
