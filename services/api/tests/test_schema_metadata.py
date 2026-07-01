from app.core.database import Base
from pathlib import Path
import ast
from app.models import (  # noqa: F401
    automation,
    data_setup,
    document,
    environment,
    generation,
    project,
    report,
    schedule,
    skill_package,
    skill_package_version,
    testcase,
)


def test_registered_model_metadata_matches_schema() -> None:
    assert sorted(Base.metadata.tables) == [
        "automation_debug_proposals",
        "automation_failure_analyses",
        "automation_final_reports",
        "automation_generations",
        "automation_reports",
        "automation_runs",
        "automation_schedules",
        "data_setup_executions",
        "data_setup_hints",
        "document_assets",
        "document_versions",
        "environments",
        "generation_tasks",
        "global_skill_definitions",
        "global_skill_versions",
        "project_skill_bindings",
        "projects",
        "skill_package_versions",
        "skill_packages",
        "test_case_directories",
        "test_case_reviews",
        "test_cases",
    ]


def test_alembic_revision_ids_fit_postgres_version_table() -> None:
    versions_dir = Path(__file__).resolve().parents[1] / "alembic" / "versions"
    revision_ids: list[str] = []

    for path in versions_dir.glob("*.py"):
        module = ast.parse(path.read_text())
        for node in module.body:
            if (
                isinstance(node, ast.AnnAssign)
                and getattr(node.target, "id", None) == "revision"
            ):
                revision_ids.append(ast.literal_eval(node.value))

    assert revision_ids
    assert [revision_id for revision_id in revision_ids if len(revision_id) > 32] == []
