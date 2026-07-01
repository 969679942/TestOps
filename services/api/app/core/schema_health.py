from __future__ import annotations

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection

from app.core.database import Base

LEGACY_REVISION_ALIASES = {
    "0005_add_test_case_ui_context": "0016_add_test_case_ui_context",
}

_PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _load_script_directory() -> ScriptDirectory:
    config = Config()
    config.set_main_option("script_location", str(_PROJECT_ROOT / "alembic"))
    return ScriptDirectory.from_config(config)


def normalize_revision_id(revision_id: str | None) -> str | None:
    if revision_id is None:
        return None
    return LEGACY_REVISION_ALIASES.get(revision_id, revision_id)


def reconcile_legacy_revision_aliases(connection: Connection) -> str | None:
    inspector = inspect(connection)
    if not inspector.has_table("alembic_version"):
        return None

    revisions = list(
        connection.execute(text("select version_num from alembic_version")).scalars()
    )
    if not revisions:
        return None

    normalized = [normalize_revision_id(revision) for revision in revisions]
    if normalized == revisions:
        return normalized[0]

    for original, updated in zip(revisions, normalized, strict=False):
        if original == updated:
            continue
        connection.execute(
            text(
                "update alembic_version set version_num = :updated where version_num = :original"
            ),
            {"original": original, "updated": updated},
        )
    return normalized[0]


def get_schema_status(connection: Connection) -> dict[str, object]:
    current_revision = reconcile_legacy_revision_aliases(connection)
    head_revision = _load_script_directory().get_current_head()
    normalized_revision = normalize_revision_id(current_revision)
    drift_issues = _collect_schema_drift_issues(connection)

    return {
        "current_revision": normalized_revision,
        "head_revision": head_revision,
        "up_to_date": normalized_revision == head_revision and not drift_issues,
        "drift_issues": drift_issues,
    }


def _collect_schema_drift_issues(connection: Connection) -> list[str]:
    inspector = inspect(connection)
    drift_issues: list[str] = []

    for table in Base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            drift_issues.append(table.name)
            continue

        actual_columns = {
            column["name"] for column in inspector.get_columns(table.name)
        }
        expected_columns = {column.name for column in table.columns}
        for missing_column in sorted(expected_columns - actual_columns):
            drift_issues.append(f"{table.name}.{missing_column}")

    return drift_issues
