from app.core.database import Base
from app.models import (  # noqa: F401
    automation,
    data_setup,
    document,
    environment,
    generation,
    project,
    report,
    testcase,
)


def test_registered_model_metadata_matches_schema() -> None:
    assert sorted(Base.metadata.tables) == [
        "automation_failure_analyses",
        "automation_generations",
        "automation_reports",
        "automation_runs",
        "data_setup_executions",
        "data_setup_hints",
        "document_assets",
        "document_versions",
        "environments",
        "generation_tasks",
        "projects",
        "test_case_reviews",
        "test_cases",
    ]
