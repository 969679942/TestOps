from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.automation import AutomationGeneration
from app.models.project import Project
from app.models.testcase import TestCase
from app.modules.automation.generator import generate_playwright_pom_files
from app.modules.document.storage import LocalArtifactStorage
from app.schemas.automation import AutomationGenerationCreate


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _get_test_case(session: Session, test_case_id: int) -> TestCase:
    test_case = session.scalar(select(TestCase).where(TestCase.id == test_case_id))
    if test_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found",
        )
    return test_case


def _get_project(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def list_project_generations(
    session: Session,
    project_id: int,
) -> list[AutomationGeneration]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(AutomationGeneration)
            .join(TestCase, AutomationGeneration.test_case_id == TestCase.id)
            .where(TestCase.project_id == project_id)
            .order_by(AutomationGeneration.created_at.desc(), AutomationGeneration.id.desc())
        )
    )


def create_generation(
    session: Session,
    test_case_id: int,
    payload: AutomationGenerationCreate,
) -> AutomationGeneration:
    test_case = _get_test_case(session, test_case_id)
    if test_case.status != "published":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only published test cases can generate automation",
        )

    generation = AutomationGeneration(
        test_case_id=test_case.id,
        status="running",
        framework=payload.framework,
        language=payload.language,
        pattern=payload.pattern,
        artifact_paths={},
    )
    session.add(generation)
    session.commit()
    session.refresh(generation)

    root = (
        Path("automation")
        / "test-cases"
        / str(test_case.id)
        / f"generation-{generation.id}"
    )
    files = generate_playwright_pom_files(test_case)
    storage = LocalArtifactStorage(Path(settings.artifact_storage_root))
    spec_path = storage.save_bytes(
        str(root / files.spec_relative_path),
        files.spec_content.encode("utf-8"),
    )
    page_object_path = storage.save_bytes(
        str(root / files.page_object_relative_path),
        files.page_object_content.encode("utf-8"),
    )

    generation.status = "completed"
    generation.artifact_root = str((Path(settings.artifact_storage_root) / root).resolve())
    generation.artifact_paths = {
        "spec": spec_path,
        "page_object": page_object_path,
    }
    generation.completed_at = _utcnow()
    session.add(generation)
    session.commit()
    session.refresh(generation)
    return generation
