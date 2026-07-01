from __future__ import annotations

from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import DocumentAsset, DocumentVersion
from app.models.global_skill_definition import GlobalSkillDefinition
from app.models.global_skill_version import GlobalSkillVersion
from app.models.generation import GenerationTask
from app.models.project import Project
from app.models.project_skill_binding import ProjectSkillBinding
from app.models.skill_package import SkillPackage
from app.models.skill_package_version import SkillPackageVersion
from app.models.testcase import TestCase
from app.modules.knowledge_context import service as knowledge_context_service
from app.modules.project import service as project_service
from app.modules.provider import UnknownProviderError, resolve_provider
from app.modules.provider.base import ProviderGenerationRequest
from app.schemas.generation import GenerationTaskCreate


class GenerationValidationError(ValueError):
    pass


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


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


def _normalize_string_list(values: Any) -> list[str]:
    if values is None:
        return []
    if not isinstance(values, list):
        raise GenerationValidationError("Expected a list of strings.")

    normalized: list[str] = []
    for item in values:
        if not isinstance(item, str):
            continue
        text = item.strip()
        if text:
            normalized.append(text)
    return normalized


def _normalize_optional_string(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def _sanitize_json_value(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return [_sanitize_json_value(item) for item in value]
    if isinstance(value, Mapping):
        return {
            str(key): _sanitize_json_value(item)
            for key, item in value.items()
            if isinstance(key, str)
        }
    return str(value)


def _normalize_source_refs(
    values: Any,
    *,
    case_index: int,
) -> list[dict[str, Any]]:
    if values is None:
        return []
    if not isinstance(values, list):
        raise GenerationValidationError(f"Case {case_index} field 'source_refs' must be a list.")

    normalized: list[dict[str, Any]] = []
    for item in values:
        if not isinstance(item, Mapping):
            continue
        normalized.append(
            {
                str(key): _sanitize_json_value(value)
                for key, value in item.items()
                if isinstance(key, str)
            }
        )
    return normalized


def _build_default_source_refs(
    *,
    context_bundle: Mapping[str, Any],
    input_refs: Mapping[str, Any],
) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = []

    for document in context_bundle.get("document_catalog", []):
        if isinstance(document, Mapping):
            refs.append(
                {
                    "source_kind": "document_version",
                    "document_asset_id": document.get("document_asset_id"),
                    "document_version_id": document.get("document_version_id"),
                    "document_name": document.get("name"),
                    "document_type": document.get("type"),
                    "parse_status": document.get("parse_status"),
                }
            )

    skill_package = context_bundle.get("skill_package", {})
    if isinstance(skill_package, Mapping):
        refs.append(
            {
                "source_kind": "skill_version",
                "skill_version_id": skill_package.get("id"),
                "skill_package_id": skill_package.get("skill_package_id"),
                "binding_id": skill_package.get("binding_id"),
                "global_skill_id": skill_package.get("metadata", {}).get("global_skill_id")
                if isinstance(skill_package.get("metadata"), Mapping)
                else None,
                "global_skill_version_id": skill_package.get("metadata", {}).get("global_skill_version_id")
                if isinstance(skill_package.get("metadata"), Mapping)
                else None,
                "skill_name": skill_package.get("name"),
                "summary": skill_package.get("summary"),
                "scenario_taxonomy": _sanitize_json_value(
                    skill_package.get("scenario_taxonomy", [])
                ),
            }
        )

    coverage_gap_note = input_refs.get("coverage_gap_note")
    if isinstance(coverage_gap_note, str) and coverage_gap_note.strip():
        refs.append(
            {
                "source_kind": "coverage_gap_note",
                "note": coverage_gap_note.strip(),
            }
        )

    return refs


def _resolve_linked_requirement(
    item: Mapping[str, Any],
    *,
    case_index: int,
    context_bundle: Mapping[str, Any],
) -> str | None:
    raw_value = item.get("linked_requirement")
    if isinstance(raw_value, str):
        normalized = raw_value.strip()
        if normalized:
            return normalized

    for candidate in context_bundle.get("requirement_candidates", []):
        if not isinstance(candidate, Mapping):
            continue
        text = candidate.get("text")
        if isinstance(text, str) and text.strip():
            return text.strip()

    acceptance_criteria = context_bundle.get("acceptance_criteria", [])
    if case_index < len(acceptance_criteria):
        candidate = acceptance_criteria[case_index]
        if isinstance(candidate, Mapping):
            text = candidate.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()

    title = item.get("title")
    if isinstance(title, str):
        normalized_title = title.strip()
        if normalized_title:
            return normalized_title

    return None


def normalize_generated_cases(
    raw: Mapping[str, Any],
    *,
    input_refs: Mapping[str, Any],
    context_bundle: Mapping[str, Any],
) -> list[dict[str, Any]]:
    cases = raw.get("cases", [])
    if not isinstance(cases, list):
        raise GenerationValidationError("Generated payload must include a cases list.")

    normalized: list[dict[str, Any]] = []
    default_source_refs = _build_default_source_refs(
        context_bundle=context_bundle,
        input_refs=input_refs,
    )
    for index, item in enumerate(cases):
        if not isinstance(item, Mapping):
            raise GenerationValidationError(
                f"Case {index} must be an object with structured fields."
            )

        title_value = item.get("title")
        title = title_value.strip() if isinstance(title_value, str) else ""
        if not title:
            raise GenerationValidationError(f"Case {index} is missing a title.")

        linked_requirement = _resolve_linked_requirement(
            item,
            case_index=index,
            context_bundle=context_bundle,
        )
        source_refs = _normalize_source_refs(item.get("source_refs"), case_index=index)

        normalized.append(
            {
                "title": title,
                "module": _normalize_optional_string(item.get("module")),
                "feature": _normalize_optional_string(item.get("feature")),
                "case_type": _normalize_optional_string(item.get("case_type")),
                "priority": _normalize_optional_string(item.get("priority")),
                "preconditions": _normalize_string_list(item.get("preconditions")),
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
                "tags": _normalize_string_list(item.get("tags")),
                "automation_flag": bool(item.get("automation_flag", False)),
                "automation_notes": _normalize_optional_string(item.get("automation_notes")),
                "linked_requirement": linked_requirement,
                "source_refs": source_refs or list(default_source_refs),
            }
        )
    return normalized


def persist_generated_cases(
    session: Session,
    *,
    project_id: int,
    generation_task_id: int,
    cases: list[dict[str, Any]],
) -> list[TestCase]:
    drafts: list[TestCase] = []
    for item in cases:
        draft = TestCase(
            project_id=project_id,
            title=item["title"],
            module=item.get("module") or "Generated",
            feature=item.get("feature") or item["title"],
            case_type=item.get("case_type") or "functional",
            priority=item.get("priority") or "medium",
            preconditions=list(item.get("preconditions", [])),
            steps=list(item["steps"]),
            expected_results=list(item["expected_results"]),
            tags=list(item.get("tags", ["ai-generated"])),
            automation_flag=bool(item.get("automation_flag", False)),
            automation_notes=item.get("automation_notes"),
            linked_requirement=item.get("linked_requirement"),
            source_refs=list(item.get("source_refs", [])),
            generation_task_id=generation_task_id,
            status="draft",
        )
        session.add(draft)
        drafts.append(draft)
    session.commit()
    for draft in drafts:
        session.refresh(draft)
    return drafts


def _load_test_cases(
    session: Session,
    *,
    project_id: int,
    test_case_ids: list[int],
) -> list[TestCase]:
    cases: list[TestCase] = []
    for test_case_id in test_case_ids:
        test_case = session.scalar(select(TestCase).where(TestCase.id == test_case_id))
        if test_case is None or test_case.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test case not found: {test_case_id}",
            )
        cases.append(test_case)
    return cases


def get_task(session: Session, task_id: int) -> GenerationTask:
    task = session.scalar(select(GenerationTask).where(GenerationTask.id == task_id))
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation task not found",
        )
    return task


def execute_generation_task(session: Session, task_id: int) -> GenerationTask:
    task = get_task(session, task_id)

    task.status = "running"
    task.started_at = task.started_at or _utcnow()
    task.error_message = None
    session.add(task)
    session.commit()
    session.refresh(task)

    try:
        provider = resolve_provider(
            task.provider,
            model=task.model,
            prompt_version=task.prompt_version,
        )
        input_refs = normalize_task_input_refs(session, task)
        context_bundle = knowledge_context_service.build_generation_context(
            session,
            project_id=task.project_id,
            version_ids=input_refs["document_version_ids"],
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
        normalized_cases = normalize_generated_cases(
            response.payload,
            input_refs=input_refs,
            context_bundle=context_bundle,
        )
        persist_generated_cases(
            session,
            project_id=task.project_id,
            generation_task_id=task.id,
            cases=normalized_cases,
        )

        task.status = "completed"
        task.finished_at = _utcnow()
        task.error_message = None
    except Exception as exc:
        task.status = "failed"
        task.finished_at = _utcnow()
        task.error_message = str(exc)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


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
    project_service.ensure_project_is_active(project)

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

    document_versions = _load_document_versions(
        session,
        project_id=project_id,
        version_ids=payload.input_document_version_ids,
    )
    skill_input_refs = _resolve_generation_skill_input(
        session,
        project_id=project_id,
        skill_version_id=payload.input_skill_version_id,
        skill_binding_id=payload.input_skill_binding_id,
    )

    task = GenerationTask(
        project_id=project_id,
        status="queued",
        provider=provider.name,
        model=provider.model,
        prompt_version=provider.prompt_version,
        input_refs={
            "document_version_ids": [version.id for version in document_versions],
            **skill_input_refs,
            "seed_test_case_ids": [test_case.id for test_case in _load_test_cases(
                session,
                project_id=project_id,
                test_case_ids=payload.seed_test_case_ids,
            )],
            "coverage_gap_note": payload.coverage_gap_note,
        },
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def normalize_task_input_refs(
    session: Session,
    task: GenerationTask,
) -> dict[str, Any]:
    input_refs = dict(task.input_refs or {})
    version_ids = _normalize_document_version_ids(session, task, input_refs)
    normalized = {
        "document_version_ids": version_ids,
        "seed_test_case_ids": _normalize_seed_test_case_ids(session, task, input_refs),
        "coverage_gap_note": _normalize_coverage_gap_note(input_refs),
    }
    normalized.update(_normalize_skill_input_refs(session, task, input_refs))

    if task.input_refs != normalized:
        task.input_refs = normalized
        session.add(task)
        session.commit()
        session.refresh(task)

    return normalized


def _resolve_generation_skill_input(
    session: Session,
    *,
    project_id: int,
    skill_version_id: int | None,
    skill_binding_id: int | None,
) -> dict[str, Any]:
    if skill_binding_id is not None:
        binding = _load_skill_binding(session, project_id=project_id, binding_id=skill_binding_id)
        version = _load_global_skill_version(
            session,
            global_skill_id=binding.global_skill_id,
            global_skill_version_id=binding.global_skill_version_id,
        )
        definition = _load_global_skill_definition(session, global_skill_id=binding.global_skill_id)
        return {
            "skill_binding_id": binding.id,
            "global_skill_id": definition.id,
            "global_skill_version_id": version.id,
            "skill_binding_snapshot": {
                "binding_id": binding.id,
                "global_skill_id": definition.id,
                "global_skill_version_id": version.id,
                "skill_key": definition.skill_key,
                "skill_name": definition.name,
                "version_label": version.version_label,
                "binding_type": binding.binding_type,
                "prompt_template": version.prompt_template,
                "scenario_taxonomy": list(version.scenario_taxonomy or []),
                "review_checklist": list(version.review_checklist or []),
                "coverage_dimensions": list(version.coverage_dimensions or []),
                "evidence_policy": version.evidence_policy,
                "override_payload": dict(binding.override_payload or {}),
            },
        }

    if skill_version_id is not None:
        skill_version = _load_skill_version(
            session,
            project_id=project_id,
            skill_version_id=skill_version_id,
        )
        return {
            "skill_version_id": skill_version.id,
        }

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Skill input is required",
    )


def _load_document_versions(
    session: Session,
    *,
    project_id: int,
    version_ids: list[int],
) -> list[DocumentVersion]:
    versions: list[DocumentVersion] = []
    for version_id in version_ids:
        version = session.scalar(
            select(DocumentVersion).where(DocumentVersion.id == version_id)
        )
        if version is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document version not found: {version_id}",
            )
        asset = session.scalar(
            select(DocumentAsset).where(DocumentAsset.id == version.document_asset_id)
        )
        if asset is None or asset.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document version not found: {version_id}",
            )
        versions.append(version)
    return versions


def _normalize_document_version_ids(
    session: Session,
    task: GenerationTask,
    input_refs: dict[str, Any],
) -> list[int]:
    version_ids = [
        int(item)
        for item in input_refs.get("document_version_ids", [])
        if isinstance(item, int)
    ]
    if version_ids:
        _load_document_versions(
            session,
            project_id=task.project_id,
            version_ids=version_ids,
        )
        return version_ids

    legacy_document_ids = [
        int(item) for item in input_refs.get("document_ids", []) if isinstance(item, int)
    ]
    if not legacy_document_ids:
        raise GenerationValidationError(
            "Generation task is missing document versions. Recreate the task from the generation page."
        )

    resolved_version_ids: list[int] = []
    for document_id in legacy_document_ids:
        asset = session.scalar(select(DocumentAsset).where(DocumentAsset.id == document_id))
        if asset is None or asset.project_id != task.project_id:
            raise GenerationValidationError(
                f"Legacy generation task references an unknown document asset: {document_id}."
            )
        latest_version = session.scalar(
            select(DocumentVersion)
            .where(DocumentVersion.document_asset_id == document_id)
            .order_by(DocumentVersion.version_no.desc(), DocumentVersion.id.desc())
        )
        if latest_version is None:
            raise GenerationValidationError(
                f"Legacy generation task document has no version history yet: {document_id}."
            )
        resolved_version_ids.append(latest_version.id)
    return resolved_version_ids


def _load_skill_version(
    session: Session,
    *,
    project_id: int,
    skill_version_id: int,
) -> SkillPackageVersion:
    skill_version = session.scalar(
        select(SkillPackageVersion).where(SkillPackageVersion.id == skill_version_id)
    )
    if skill_version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package version not found",
        )
    skill_package = session.scalar(
        select(SkillPackage).where(SkillPackage.id == skill_version.skill_package_id)
    )
    if skill_package is None or skill_package.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill package version not found",
        )
    return skill_version


def _normalize_skill_version_id(
    session: Session,
    task: GenerationTask,
    input_refs: dict[str, Any],
) -> int:
    raw_skill_version_id = input_refs.get("skill_version_id")
    if isinstance(raw_skill_version_id, int):
        skill_version_id = raw_skill_version_id
    elif isinstance(raw_skill_version_id, str) and raw_skill_version_id.isdigit():
        skill_version_id = int(raw_skill_version_id)
    else:
        skill_version_id = _resolve_legacy_active_skill_version_id(session, task.project_id)

    _load_skill_version(
        session,
        project_id=task.project_id,
        skill_version_id=skill_version_id,
    )
    return skill_version_id


def _load_skill_binding(
    session: Session,
    *,
    project_id: int,
    binding_id: int,
) -> ProjectSkillBinding:
    binding = session.scalar(
        select(ProjectSkillBinding).where(ProjectSkillBinding.id == binding_id)
    )
    if binding is None or binding.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project skill binding not found",
        )
    return binding


def _load_global_skill_definition(
    session: Session,
    *,
    global_skill_id: int,
) -> GlobalSkillDefinition:
    definition = session.scalar(
        select(GlobalSkillDefinition).where(GlobalSkillDefinition.id == global_skill_id)
    )
    if definition is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global skill not found",
        )
    return definition


def _load_global_skill_version(
    session: Session,
    *,
    global_skill_id: int,
    global_skill_version_id: int,
) -> GlobalSkillVersion:
    version = session.scalar(
        select(GlobalSkillVersion).where(GlobalSkillVersion.id == global_skill_version_id)
    )
    if version is None or version.global_skill_id != global_skill_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global skill version not found",
        )
    return version


def _normalize_skill_input_refs(
    session: Session,
    task: GenerationTask,
    input_refs: dict[str, Any],
) -> dict[str, Any]:
    raw_binding_id = input_refs.get("skill_binding_id")
    if isinstance(raw_binding_id, str) and raw_binding_id.isdigit():
        raw_binding_id = int(raw_binding_id)
    if isinstance(raw_binding_id, int):
        binding = _load_skill_binding(session, project_id=task.project_id, binding_id=raw_binding_id)
        definition = _load_global_skill_definition(
            session,
            global_skill_id=binding.global_skill_id,
        )
        version = _load_global_skill_version(
            session,
            global_skill_id=binding.global_skill_id,
            global_skill_version_id=binding.global_skill_version_id,
        )
        snapshot = input_refs.get("skill_binding_snapshot")
        snapshot_payload = snapshot if isinstance(snapshot, Mapping) else {}
        return {
            "skill_binding_id": binding.id,
            "global_skill_id": definition.id,
            "global_skill_version_id": version.id,
            "skill_binding_snapshot": {
                "binding_id": binding.id,
                "global_skill_id": definition.id,
                "global_skill_version_id": version.id,
                "skill_key": definition.skill_key,
                "skill_name": definition.name,
                "version_label": version.version_label,
                "binding_type": binding.binding_type,
                "prompt_template": snapshot_payload.get("prompt_template", version.prompt_template),
                "scenario_taxonomy": _sanitize_json_value(
                    snapshot_payload.get("scenario_taxonomy", list(version.scenario_taxonomy or []))
                ),
                "review_checklist": _sanitize_json_value(
                    snapshot_payload.get("review_checklist", list(version.review_checklist or []))
                ),
                "coverage_dimensions": _sanitize_json_value(
                    snapshot_payload.get("coverage_dimensions", list(version.coverage_dimensions or []))
                ),
                "evidence_policy": snapshot_payload.get("evidence_policy", version.evidence_policy),
                "override_payload": _sanitize_json_value(
                    snapshot_payload.get("override_payload", dict(binding.override_payload or {}))
                ),
            },
        }

    skill_version_id = _normalize_skill_version_id(session, task, input_refs)
    return {
        "skill_version_id": skill_version_id,
    }


def _resolve_legacy_active_skill_version_id(session: Session, project_id: int) -> int:
    active_version_ids = [
        item
        for item in session.scalars(
            select(SkillPackage.active_version_id).where(SkillPackage.project_id == project_id)
        )
        if isinstance(item, int)
    ]
    unique_active_version_ids = sorted(set(active_version_ids))
    if len(unique_active_version_ids) == 1:
        return unique_active_version_ids[0]
    if len(unique_active_version_ids) > 1:
        raise GenerationValidationError(
            "Legacy generation task is missing a skill version and the project has multiple active skill packages. Recreate the task and choose one skill version explicitly."
        )
    raise GenerationValidationError(
        "Legacy generation task is missing a skill version. Activate a skill package and recreate the task."
    )


def _normalize_seed_test_case_ids(
    session: Session,
    task: GenerationTask,
    input_refs: dict[str, Any],
) -> list[int]:
    test_case_ids: list[int] = []
    for item in input_refs.get("seed_test_case_ids", []):
        if isinstance(item, int):
            test_case_ids.append(item)
        elif isinstance(item, str) and item.isdigit():
            test_case_ids.append(int(item))

    if not test_case_ids:
        return []

    _load_test_cases(
        session,
        project_id=task.project_id,
        test_case_ids=test_case_ids,
    )
    return test_case_ids


def _normalize_coverage_gap_note(input_refs: dict[str, Any]) -> str | None:
    raw_value = input_refs.get("coverage_gap_note")
    if not isinstance(raw_value, str):
        return None

    normalized = raw_value.strip()
    return normalized or None


def list_tasks(session: Session, project_id: int) -> list[GenerationTask]:
    project_service.get_project(session, project_id)
    return list(
        session.scalars(
            select(GenerationTask)
            .where(GenerationTask.project_id == project_id)
            .order_by(GenerationTask.created_at.desc(), GenerationTask.id.desc())
        )
    )


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
    task.status = "failed"
    task.finished_at = _utcnow()
    task.error_message = message
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
