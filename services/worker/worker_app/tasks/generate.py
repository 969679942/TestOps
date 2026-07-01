from __future__ import annotations

import inspect
from datetime import UTC, datetime
from typing import Any

from app.core.database import SessionLocal
from app.models.generation import GenerationTask
from app.modules.generation import service as generation_service
from app.modules.knowledge_context import service as knowledge_context_service
from app.modules.provider import ProviderGenerationRequest, resolve_provider
from worker_app.celery_app import celery_app


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _normalize_generated_cases_with_compat(
    payload: dict[str, Any],
    *,
    input_refs: dict[str, Any],
    context_bundle: dict[str, Any],
) -> list[dict[str, Any]]:
    parameters = inspect.signature(generation_service.normalize_generated_cases).parameters
    if "input_refs" in parameters and "context_bundle" in parameters:
        return generation_service.normalize_generated_cases(
            payload,
            input_refs=input_refs,
            context_bundle=context_bundle,
        )
    return generation_service.normalize_generated_cases(payload)


def _persist_generated_cases_with_compat(
    session: Any,
    *,
    project_id: int,
    generation_task_id: int,
    cases: list[dict[str, Any]],
) -> None:
    parameters = inspect.signature(generation_service.persist_generated_cases).parameters
    if "generation_task_id" in parameters:
        generation_service.persist_generated_cases(
            session,
            project_id=project_id,
            generation_task_id=generation_task_id,
            cases=cases,
        )
        return

    generation_service.persist_generated_cases(
        session,
        project_id=project_id,
        cases=cases,
    )


def _build_generation_context_with_compat(
    session: Any,
    *,
    project_id: int,
    input_refs: dict[str, Any],
) -> dict[str, Any]:
    parameters = inspect.signature(knowledge_context_service.build_generation_context).parameters
    if "input_refs" in parameters:
        return knowledge_context_service.build_generation_context(
            session,
            project_id=project_id,
            version_ids=input_refs["document_version_ids"],
            input_refs=input_refs,
        )

    return knowledge_context_service.build_generation_context(
        session,
        project_id=project_id,
        version_ids=input_refs["document_version_ids"],
        skill_version_id=input_refs["skill_version_id"],
    )


@celery_app.task(name="generation.generate_test_cases")
def generate_test_cases(generation_task_id: int) -> dict[str, Any]:
    session = SessionLocal()
    task: GenerationTask | None = None

    try:
        task = session.get(GenerationTask, generation_task_id)
        if task is None:
            return {
                "generation_task_id": generation_task_id,
                "status": "missing",
                "message": "Generation task not found.",
            }

        task.status = "running"
        task.started_at = task.started_at or _utcnow()
        task.error_message = None
        session.commit()

        provider = resolve_provider(
            task.provider,
            model=task.model,
            prompt_version=task.prompt_version,
        )
        input_refs = generation_service.normalize_task_input_refs(session, task)
        context_bundle = _build_generation_context_with_compat(
            session,
            project_id=task.project_id,
            input_refs=input_refs,
        )
        response = provider.generate_test_cases(
            ProviderGenerationRequest(
                project_id=task.project_id,
                prompt_version=task.prompt_version,
                input_refs=input_refs,
                context_bundle=context_bundle,
            )
        )
        normalized_cases = _normalize_generated_cases_with_compat(
            response.payload,
            input_refs=input_refs,
            context_bundle=context_bundle,
        )
        _persist_generated_cases_with_compat(
            session,
            project_id=task.project_id,
            generation_task_id=task.id,
            cases=normalized_cases,
        )

        task.status = "completed"
        task.finished_at = _utcnow()
        task.error_message = None
        session.commit()

        return {
            "generation_task_id": task.id,
            "status": task.status,
            "provider": response.provider,
            "model": response.model,
            "generated_case_count": len(normalized_cases),
        }
    except Exception as exc:
        if task is not None:
            task.status = "failed"
            task.finished_at = _utcnow()
            task.error_message = str(exc)
            session.commit()
        raise
    finally:
        session.close()
