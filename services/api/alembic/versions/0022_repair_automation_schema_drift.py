"""repair automation schema drift

Revision ID: 0022_repair_auto_schema
Revises: 0021_add_test_case_traceability
Create Date: 2026-06-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0022_repair_auto_schema"
down_revision: str | None = "0021_add_test_case_traceability"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _create_table_if_missing(existing_tables: set[str], name: str, *columns, **kwargs) -> None:
    if name in existing_tables:
        return
    op.create_table(name, *columns, **kwargs)
    existing_tables.add(name)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    _create_table_if_missing(
        existing_tables,
        "automation_generations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("test_case_id", sa.Integer(), sa.ForeignKey("test_cases.id"), nullable=False),
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

    _create_table_if_missing(
        existing_tables,
        "automation_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "automation_generation_id",
            sa.Integer(),
            sa.ForeignKey("automation_generations.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column(
            "trigger_mode",
            sa.String(length=32),
            nullable=False,
            server_default="manual",
        ),
        sa.Column("report_path", sa.Text(), nullable=True),
        sa.Column("summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
    )

    _create_table_if_missing(
        existing_tables,
        "automation_failure_analyses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("automation_run_id", sa.Integer(), sa.ForeignKey("automation_runs.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="completed"),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="codex"),
        sa.Column(
            "model",
            sa.String(length=64),
            nullable=False,
            server_default="codex-placeholder",
        ),
        sa.Column("classification", sa.String(length=64), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("recommendations", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("should_rerun", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    _create_table_if_missing(
        existing_tables,
        "environments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("base_url", sa.Text(), nullable=False),
        sa.Column("api_base_url", sa.Text(), nullable=False),
        sa.Column("auth_profile", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("project_id", "code", name="environments_project_code_key"),
    )

    _create_table_if_missing(
        existing_tables,
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

    _create_table_if_missing(
        existing_tables,
        "automation_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("automation_run_id", sa.Integer(), sa.ForeignKey("automation_runs.id"), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("artifact_root", sa.Text(), nullable=False),
        sa.Column("index_path", sa.Text(), nullable=False),
        sa.Column("summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    _create_table_if_missing(
        existing_tables,
        "automation_schedules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("environment_id", sa.Integer(), sa.ForeignKey("environments.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("target_generation_ids", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("cron_expression", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("next_run_at", sa.DateTime(), nullable=True),
        sa.Column("last_run_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    _create_table_if_missing(
        existing_tables,
        "automation_debug_proposals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "automation_failure_analysis_id",
            sa.Integer(),
            sa.ForeignKey("automation_failure_analyses.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("proposal_type", sa.String(length=32), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("patch_proposal", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("recommendations", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("reviewer_id", sa.String(length=120), nullable=True),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )

    _create_table_if_missing(
        existing_tables,
        "automation_final_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("automation_run_id", sa.Integer(), sa.ForeignKey("automation_runs.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="ready"),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("lark_status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("lark_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("pushed_at", sa.DateTime(), nullable=True),
    )

    _create_table_if_missing(
        existing_tables,
        "data_setup_executions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("data_setup_hint_id", sa.Integer(), sa.ForeignKey("data_setup_hints.id"), nullable=False),
        sa.Column("automation_run_id", sa.Integer(), sa.ForeignKey("automation_runs.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column("request_summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("response_summary", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    for table_name in (
        "data_setup_executions",
        "automation_final_reports",
        "automation_debug_proposals",
        "automation_schedules",
        "automation_reports",
        "data_setup_hints",
        "environments",
        "automation_failure_analyses",
        "automation_runs",
        "automation_generations",
    ):
        if table_name in existing_tables:
            op.drop_table(table_name)
