import os
from urllib.parse import urlparse, urlunparse

from celery import Celery


def _derive_result_backend(broker_url: str) -> str:
    explicit_backend = os.getenv("TESTOPS_REDIS_RESULT_BACKEND")
    if explicit_backend:
        return explicit_backend

    parsed = urlparse(broker_url)
    if not parsed.scheme.startswith("redis"):
        return broker_url

    database_fragment = parsed.path.lstrip("/") or "0"
    try:
        database_index = int(database_fragment)
    except ValueError:
        return broker_url

    return urlunparse(parsed._replace(path=f"/{database_index + 1}"))


broker_url = (
    os.getenv("TESTOPS_REDIS_BROKER_URL")
    or os.getenv("TESTOPS_REDIS_URL")
    or os.getenv("REDIS_URL")
    or "redis://localhost:6379/0"
)

celery_app = Celery(
    "testops_worker",
    broker=broker_url,
    backend=_derive_result_backend(broker_url),
    include=[
        "worker_app.tasks.generate",
        "worker_app.tasks.parse",
        "worker_app.tasks.run_automation",
        "worker_app.tasks.schedule",
    ],
)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
