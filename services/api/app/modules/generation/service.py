from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.generation import GenerationTask
from app.models.project import Project
from app.modules.provider import UnknownProviderError, resolve_provider
from app.schemas.generation import GenerationTaskCreate


class GenerationValidationError(ValueError):
    pass


def _normalize_text_items(
    values: Any,
    *,
    field_name: str,
    case_index: int,
) -> list[dict[str, str]]:
    if values is None:
        return []
    if not isinstance(values, list):
        raise GenerationValidationError(
            f"Case {case_index} field '{field_name}' must be a list."
        )

    normalized_items: list[dict[str, str]] = []
    for item in values:
        if isinstance(item, str):
            text = item.strip()
        elif isinstance(item, Mapping):
            raw_text = item.get("text")
            text = raw_text.strip() if isinstance(raw_text, str) else ""
        else:
            text = ""

        if not text:
            raise GenerationValidationError(
                f"Case {case_index} field '{field_name}' contains a blank item."
            )
        normalized_items.append({"text": text})
    return normalized_items


def normalize_generated_cases(raw: Mapping[str, Any]) -> list[dict[str, Any]]:
    cases = raw.get("cases", [])
    if not isinstance(cases, list):
        raise GenerationValidationError("Generated payload must include a cases list.")

    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(cases):
        if not isinstance(item, Mapping):
            raise GenerationValidationError(
                f"Case {index} must be an object with structured fields."
            )

        title_value = item.get("title")
        title = title_value.strip() if isinstance(title_value, str) else ""
        if not title:
            raise GenerationValidationError(f"Case {index} is missing a title.")

        normalized.append(
            {
                "title": title,
                "steps": _normalize_text_items(
                    item.get("steps", []),
                    field_name="steps",
                    case_index=index,
                ),
                "expected_results": _normalize_text_items(
                    item.get("expected_results", []),
                    field_name="expected_results",
                    case_index=index,
                ),
            }
        )
    return normalized


def create_task(
    session: Session,
    project_id: int,
    payload: GenerationTaskCreate,
) -> GenerationTask:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    provider_name = payload.provider or project.default_provider
    prompt_version = payload.prompt_profile or project.default_prompt_profile

    try:
        provider = resolve_provider(
            provider_name,
            model=payload.model,
            prompt_version=prompt_version,
        )
    except UnknownProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    task = GenerationTask(
        project_id=project_id,
        status="queued",
        provider=provider.name,
        model=provider.model,
        prompt_version=provider.prompt_version,
        input_refs={"document_ids": payload.input_document_ids},
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def dispatch_generation_task(task_id: int) -> str | None:
    try:
        from celery import Celery
    except ModuleNotFoundError:
        return "Generation dispatch client is not installed in the API environment."

    try:
        from redis import Redis

        redis_client = Redis.from_url(
            settings.redis_url,
            socket_connect_timeout=0.2,
            socket_timeout=0.2,
        )
        redis_client.ping()
    except Exception as exc:  # pragma: no cover - depends on broker availability
        return f"Generation dispatch could not reach the broker: {exc}"

    client = Celery("testops_api", broker=settings.redis_url, backend=settings.redis_url)
    client.conf.update(
        broker_connection_retry=False,
        broker_connection_retry_on_startup=False,
        broker_connection_timeout=1,
        broker_transport_options={
            "socket_connect_timeout": 1,
            "socket_timeout": 1,
        },
    )
    try:
        client.send_task(
            "generation.generate_test_cases",
            args=[task_id],
            retry=False,
        )
    except Exception as exc:  # pragma: no cover - depends on broker availability
        return f"Generation dispatch could not reach the broker: {exc}"
    return None


def record_dispatch_issue(
    session: Session,
    task: GenerationTask,
    message: str,
) -> GenerationTask:
    task.error_message = message
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
