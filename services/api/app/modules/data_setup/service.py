from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.automation import AutomationGeneration, AutomationRun
from app.models.data_setup import DataSetupExecution, DataSetupHint
from app.models.document import DocumentAsset, DocumentVersion
from app.models.environment import Environment
from app.models.project import Project
from app.models.testcase import TestCase
from app.schemas.data_setup import DataSetupExecutionCreate, DataSetupHintCreate


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _get_project(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def _get_test_case(session: Session, test_case_id: int) -> TestCase:
    test_case = session.scalar(select(TestCase).where(TestCase.id == test_case_id))
    if test_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found",
        )
    return test_case


def _get_environment(session: Session, environment_id: int) -> Environment:
    environment = session.scalar(
        select(Environment).where(Environment.id == environment_id)
    )
    if environment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found",
        )
    return environment


def _get_document_version(session: Session, version_id: int) -> DocumentVersion:
    version = session.scalar(
        select(DocumentVersion).where(DocumentVersion.id == version_id)
    )
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document version not found",
        )
    return version


def _get_document_project_id(session: Session, version: DocumentVersion) -> int:
    project_id = session.scalar(
        select(DocumentAsset.project_id).where(
            DocumentAsset.id == version.document_asset_id
        )
    )
    if project_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return project_id


def _get_hint(session: Session, hint_id: int) -> DataSetupHint:
    hint = session.scalar(select(DataSetupHint).where(DataSetupHint.id == hint_id))
    if hint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data setup hint not found",
        )
    return hint


def _get_run(session: Session, run_id: int) -> AutomationRun:
    run = session.scalar(select(AutomationRun).where(AutomationRun.id == run_id))
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation run not found",
        )
    return run


def _get_run_test_case_id(session: Session, run: AutomationRun) -> int:
    test_case_id = session.scalar(
        select(AutomationGeneration.test_case_id).where(
            AutomationGeneration.id == run.automation_generation_id
        )
    )
    if test_case_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation generation not found",
        )
    return test_case_id


def _ensure_same_project(
    test_case: TestCase,
    environment: Environment,
    document_project_id: int,
) -> None:
    if (
        test_case.project_id != environment.project_id
        or test_case.project_id != document_project_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Data setup hint references must belong to the same project",
        )


def _ensure_hint_belongs_to_run(
    session: Session,
    hint: DataSetupHint,
    run: AutomationRun,
) -> None:
    if hint.test_case_id != _get_run_test_case_id(session, run):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Data setup hint must belong to the automation run test case",
        )


def _build_safe_url(environment: Environment, endpoint: str) -> str:
    parsed_endpoint = urlparse(endpoint)
    if (
        parsed_endpoint.scheme
        or parsed_endpoint.netloc
        or not endpoint.startswith("/")
        or endpoint.startswith("//")
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Data setup endpoint must be a relative API path",
        )

    parsed_base = urlparse(environment.api_base_url)
    if not parsed_base.scheme or not parsed_base.netloc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Environment API base URL is not configured",
        )

    return f"{environment.api_base_url.rstrip('/')}{endpoint}"


def _render_template(value: Any, variables: dict[str, Any]) -> Any:
    if isinstance(value, dict):
        return {key: _render_template(item, variables) for key, item in value.items()}
    if isinstance(value, list):
        return [_render_template(item, variables) for item in value]
    if isinstance(value, str) and value.startswith("{{") and value.endswith("}}"):
        variable_name = value[2:-2].strip()
        return variables.get(variable_name, value)
    return value


def _json_keys(value: Any) -> list[str]:
    if isinstance(value, dict):
        return list(value.keys())
    return []


def create_hint(
    session: Session,
    test_case_id: int,
    payload: DataSetupHintCreate,
) -> DataSetupHint:
    test_case = _get_test_case(session, test_case_id)
    environment = _get_environment(session, payload.environment_id)
    document_version = _get_document_version(session, payload.document_version_id)
    document_project_id = _get_document_project_id(session, document_version)
    _ensure_same_project(test_case, environment, document_project_id)

    hint = DataSetupHint(
        test_case_id=test_case.id,
        document_version_id=document_version.id,
        environment_id=environment.id,
        endpoint=payload.endpoint,
        method=payload.method.lower(),
        request_template=payload.request_template,
        purpose=payload.purpose,
        confidence_score=payload.confidence_score,
        status="ready",
    )
    session.add(hint)
    session.commit()
    session.refresh(hint)
    return hint


def execute_hint(
    session: Session,
    run_id: int,
    payload: DataSetupExecutionCreate,
) -> DataSetupExecution:
    run = _get_run(session, run_id)
    hint = _get_hint(session, payload.data_setup_hint_id)
    _ensure_hint_belongs_to_run(session, hint, run)
    environment = _get_environment(session, hint.environment_id)
    url = _build_safe_url(environment, hint.endpoint)
    body = _render_template(hint.request_template, payload.variables)

    execution = DataSetupExecution(
        data_setup_hint_id=hint.id,
        automation_run_id=run.id,
        status="running",
        request_summary={
            "method": hint.method,
            "url": url,
            "body_keys": _json_keys(body),
        },
        response_summary={},
    )
    session.add(execution)
    session.commit()
    session.refresh(execution)

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.request(hint.method, url, json=body)
        try:
            response_json = response.json()
        except ValueError:
            response_json = {}
        execution.response_summary = {
            "status_code": response.status_code,
            "json_keys": _json_keys(response_json),
        }
        execution.status = "completed" if response.status_code < 400 else "failed"
    except httpx.HTTPError as exc:
        execution.status = "failed"
        execution.error_message = str(exc)

    execution.completed_at = _utcnow()
    session.add(execution)
    session.commit()
    session.refresh(execution)
    return execution


def list_run_executions(
    session: Session,
    run_id: int,
) -> list[DataSetupExecution]:
    _get_run(session, run_id)
    return list(
        session.scalars(
            select(DataSetupExecution)
            .where(DataSetupExecution.automation_run_id == run_id)
            .order_by(DataSetupExecution.id)
        )
    )


def list_project_executions(
    session: Session,
    project_id: int,
) -> list[DataSetupExecution]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(DataSetupExecution)
            .join(
                DataSetupHint,
                DataSetupExecution.data_setup_hint_id == DataSetupHint.id,
            )
            .join(TestCase, DataSetupHint.test_case_id == TestCase.id)
            .where(TestCase.project_id == project_id)
            .order_by(DataSetupExecution.id)
        )
    )


def list_test_case_hints(
    session: Session,
    test_case_id: int,
) -> list[DataSetupHint]:
    _get_test_case(session, test_case_id)
    return list(
        session.scalars(
            select(DataSetupHint)
            .where(DataSetupHint.test_case_id == test_case_id)
            .order_by(DataSetupHint.id)
        )
    )


def list_project_hints(
    session: Session,
    project_id: int,
) -> list[DataSetupHint]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(DataSetupHint)
            .join(TestCase, DataSetupHint.test_case_id == TestCase.id)
            .where(TestCase.project_id == project_id)
            .order_by(DataSetupHint.id)
        )
    )
