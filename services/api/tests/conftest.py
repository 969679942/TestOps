from collections.abc import Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text

from app.core.database import engine
from app.main import app

_ROOT = Path(__file__).resolve().parents[1]
_ALEMBIC_CONFIG = Config(str(_ROOT / "alembic.ini"))
_ALEMBIC_CONFIG.set_main_option("script_location", str(_ROOT / "alembic"))


def _upgrade_database() -> None:
    command.upgrade(_ALEMBIC_CONFIG, "head")


def _reset_database() -> None:
    existing_tables = [
        table_name
        for table_name in inspect(engine).get_table_names()
        if table_name != "alembic_version"
    ]
    if not existing_tables:
        return

    table_list = ", ".join(existing_tables)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"))


@pytest.fixture(scope="session", autouse=True)
def _prepare_database() -> None:
    _upgrade_database()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    _reset_database()

    with TestClient(app) as test_client:
        yield test_client

    _reset_database()
