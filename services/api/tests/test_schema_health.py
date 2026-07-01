from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

from app.core.schema_health import get_schema_status


def test_upgrade_accepts_legacy_revision_alias(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'legacy-alias.sqlite'}"
    project_root = Path(__file__).resolve().parents[1]
    alembic_config = Config(str(project_root / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(project_root / "alembic"))
    alembic_config.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(alembic_config, "0016_add_test_case_ui_context")

    engine = create_engine(database_url, future=True)
    with engine.begin() as connection:
        connection.execute(
            text(
                "update alembic_version set version_num = '0005_add_test_case_ui_context'"
            )
        )

    command.upgrade(alembic_config, "head")

    with engine.connect() as connection:
        revision = connection.execute(text("select version_num from alembic_version")).scalar()

    assert revision == "0024_add_project_skill_bindings"


def test_schema_status_detects_physical_schema_drift(tmp_path: Path) -> None:
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

    with engine.connect() as connection:
        status = get_schema_status(connection)

    assert status["current_revision"] == "0019_add_skill_packages"
    assert status["head_revision"] == "0024_add_project_skill_bindings"
    assert status["up_to_date"] is False
    assert "document_assets.parse_status" in status["drift_issues"]
    assert "document_versions" in status["drift_issues"]
