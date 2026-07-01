from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text


def test_upgrade_repairs_legacy_document_schema_drift(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'schema-drift.sqlite'}"
    engine = create_engine(database_url, future=True)

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                create table document_assets (
                    id integer primary key,
                    project_id integer not null,
                    type varchar(32) not null,
                    name varchar(255) not null,
                    source_mode varchar(32) not null,
                    source_uri text
                )
                """
            )
        )
        connection.execute(text("create table alembic_version (version_num varchar(32) not null)"))
        connection.execute(
            text(
                "insert into alembic_version(version_num) values ('0019_add_skill_packages')"
            )
        )

    project_root = Path(__file__).resolve().parents[1]
    alembic_config = Config(str(project_root / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(project_root / "alembic"))
    alembic_config.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(alembic_config, "head")

    inspector = inspect(engine)
    document_asset_columns = {
        column["name"] for column in inspector.get_columns("document_assets")
    }

    assert "parse_status" in document_asset_columns
    assert inspector.has_table("document_versions")


def test_upgrade_repairs_legacy_automation_schema_drift(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'automation-drift.sqlite'}"
    engine = create_engine(database_url, future=True)

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                create table projects (
                    id integer primary key,
                    name varchar(255) not null,
                    description text,
                    status varchar(32) not null,
                    created_at datetime not null,
                    updated_at datetime not null,
                    archived integer not null default 0
                )
                """
            )
        )
        connection.execute(
            text(
                """
                create table document_assets (
                    id integer primary key,
                    project_id integer not null,
                    type varchar(32) not null,
                    name varchar(255) not null,
                    source_mode varchar(32) not null,
                    source_uri text,
                    parse_status varchar(32) not null default 'uploaded'
                )
                """
            )
        )
        connection.execute(
            text(
                """
                create table document_versions (
                    id integer primary key,
                    document_asset_id integer not null,
                    version_no integer not null,
                    storage_path text,
                    checksum varchar(64),
                    source_uri text,
                    parse_status varchar(32) not null default 'uploaded',
                    parse_summary text,
                    structured_metadata json not null default '{}',
                    created_at datetime not null
                )
                """
            )
        )
        connection.execute(
            text(
                """
                create table generation_tasks (
                    id integer primary key,
                    project_id integer not null,
                    source_document_id integer,
                    status varchar(32) not null,
                    mode varchar(32) not null,
                    provider varchar(32) not null,
                    parameters json not null,
                    result_payload json,
                    error_message text,
                    created_at datetime not null,
                    updated_at datetime not null
                )
                """
            )
        )
        connection.execute(
            text(
                """
                create table test_cases (
                    id integer primary key,
                    project_id integer not null,
                    generation_task_id integer,
                    title varchar(255) not null,
                    preconditions text,
                    steps json not null,
                    expected_result text not null,
                    priority varchar(16) not null,
                    category varchar(64) not null,
                    state varchar(32) not null,
                    tags json not null,
                    raw_payload json,
                    ui_context json not null default '{}',
                    linked_requirement text,
                    source_refs json not null default '[]',
                    created_at datetime not null,
                    updated_at datetime not null
                )
                """
            )
        )
        connection.execute(text("create table alembic_version (version_num varchar(32) not null)"))
        connection.execute(
            text(
                "insert into alembic_version(version_num) values ('0021_add_test_case_traceability')"
            )
        )

    project_root = Path(__file__).resolve().parents[1]
    alembic_config = Config(str(project_root / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(project_root / "alembic"))
    alembic_config.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(alembic_config, "head")

    inspector = inspect(engine)
    assert inspector.has_table("automation_generations")
    assert inspector.has_table("automation_runs")
    assert inspector.has_table("automation_failure_analyses")
    assert inspector.has_table("environments")
    assert inspector.has_table("data_setup_hints")
    assert inspector.has_table("automation_reports")
    assert inspector.has_table("automation_schedules")
    assert inspector.has_table("automation_debug_proposals")
    assert inspector.has_table("automation_final_reports")
    assert inspector.has_table("data_setup_executions")
