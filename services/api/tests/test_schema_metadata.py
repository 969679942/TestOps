from app.core.database import Base
from app.models import project  # noqa: F401


def test_task_2_metadata_matches_initial_schema() -> None:
    assert sorted(Base.metadata.tables) == ["projects"]
