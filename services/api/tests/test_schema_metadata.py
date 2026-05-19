from app.core.database import Base
from app.models import document, generation, project  # noqa: F401


def test_task_3_metadata_matches_schema() -> None:
    assert sorted(Base.metadata.tables) == [
        "document_assets",
        "generation_tasks",
        "projects",
    ]
