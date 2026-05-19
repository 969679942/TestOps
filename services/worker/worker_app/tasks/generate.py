from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.database import SessionLocal
from app.models.generation import GenerationTask
from app.modules.generation import service as generation_service
from app.modules.provider import ProviderGenerationRequest, resolve_provider
from worker_app.celery_app import celery_app


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


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
        response = provider.generate_test_cases(
            ProviderGenerationRequest(
                project_id=task.project_id,
                prompt_version=task.prompt_version,
                input_refs=task.input_refs,
            )
        )
        normalized_cases = generation_service.normalize_generated_cases(response.payload)

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

        return {
            "generation_task_id": generation_task_id,
            "status": "failed",
            "error": str(exc),
        }
    finally:
        session.close()
