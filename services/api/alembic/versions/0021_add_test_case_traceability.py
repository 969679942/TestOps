"""add test case traceability fields

Revision ID: 0021_add_test_case_traceability
Revises: 0020_repair_document_schema
Create Date: 2026-06-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0021_add_test_case_traceability"
down_revision: str | None = "0020_repair_document_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("test_cases"):
        return

    columns = {column["name"] for column in inspector.get_columns("test_cases")}

    foreign_key_names = {
        foreign_key.get("name")
        for foreign_key in inspector.get_foreign_keys("test_cases")
        if foreign_key.get("name")
    }

    with op.batch_alter_table("test_cases") as batch_op:
        if "linked_requirement" not in columns:
            batch_op.add_column(
                sa.Column("linked_requirement", sa.String(length=255), nullable=True)
            )
        if "source_refs" not in columns:
            batch_op.add_column(
                sa.Column(
                    "source_refs",
                    sa.JSON(),
                    nullable=False,
                    server_default="[]",
                )
            )
        if "generation_task_id" not in columns:
            batch_op.add_column(
                sa.Column(
                    "generation_task_id",
                    sa.Integer(),
                    nullable=True,
                )
            )
        if "fk_test_cases_generation_task_id" not in foreign_key_names:
            batch_op.create_foreign_key(
                "fk_test_cases_generation_task_id",
                "generation_tasks",
                ["generation_task_id"],
                ["id"],
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("test_cases"):
        return

    columns = {column["name"] for column in inspector.get_columns("test_cases")}
    foreign_key_names = {
        foreign_key.get("name")
        for foreign_key in inspector.get_foreign_keys("test_cases")
        if foreign_key.get("name")
    }

    with op.batch_alter_table("test_cases") as batch_op:
        if "fk_test_cases_generation_task_id" in foreign_key_names:
            batch_op.drop_constraint(
                "fk_test_cases_generation_task_id",
                type_="foreignkey",
            )
        if "generation_task_id" in columns:
            batch_op.drop_column("generation_task_id")
        if "source_refs" in columns:
            batch_op.drop_column("source_refs")
        if "linked_requirement" in columns:
            batch_op.drop_column("linked_requirement")
