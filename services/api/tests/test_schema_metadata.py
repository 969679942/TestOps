from app.core.database import Base
from app.models import automation, document, generation, project, testcase  # noqa: F401


def test_registered_model_metadata_matches_schema() -> None:
    assert sorted(Base.metadata.tables) == [
        "automation_generations",
        "document_assets",
        "document_versions",
        "generation_tasks",
        "projects",
        "test_case_reviews",
        "test_cases",
    ]
