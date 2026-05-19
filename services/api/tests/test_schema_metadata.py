from app.core.database import Base
from app.models import document, generation, project, testcase  # noqa: F401


def test_registered_model_metadata_matches_schema() -> None:
    assert sorted(Base.metadata.tables) == [
        "document_assets",
        "generation_tasks",
        "projects",
        "test_case_reviews",
        "test_cases",
    ]
