from collections.abc import Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import get_session
from app.main import app

_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def test_database_url(tmp_path) -> str:
    return f"sqlite:///{tmp_path / 'task3-routes.sqlite'}"


@pytest.fixture
def client(test_database_url: str) -> Generator[TestClient, None, None]:
    alembic_config = Config(str(_ROOT / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(_ROOT / "alembic"))
    alembic_config.set_main_option("sqlalchemy.url", test_database_url)
    command.upgrade(alembic_config, "head")

    engine = create_engine(
        test_database_url,
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_session() -> Generator[Session, None, None]:
        session = testing_session_local()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_get_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
