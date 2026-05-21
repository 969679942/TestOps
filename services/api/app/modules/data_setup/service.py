from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.data_setup import DataSetupHint
from app.models.document import DocumentAsset, DocumentVersion
from app.models.environment import Environment
from app.models.project import Project
from app.models.testcase import TestCase
from app.schemas.data_setup import DataSetupHintCreate


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
