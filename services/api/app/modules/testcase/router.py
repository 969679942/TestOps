from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.testcase import service as testcase_service
from app.schemas.testcase import (
    TestCaseCreate,
    TestCaseImportRequest,
    TestCaseRead,
    TestCaseUpdate,
)
from app.schemas.testcase_directory import TestCaseDirectoryCreate, TestCaseDirectoryRead

router = APIRouter(tags=["testcases"])


@router.get("/projects/{project_id}/test-case-directories", response_model=list[TestCaseDirectoryRead])
def list_test_case_directories(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[TestCaseDirectoryRead]:
    return testcase_service.list_test_case_directories(session, project_id)


@router.post(
    "/projects/{project_id}/test-case-directories",
    response_model=TestCaseDirectoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_test_case_directory(
    project_id: int,
    payload: TestCaseDirectoryCreate,
    session: Session = Depends(get_session),
) -> TestCaseDirectoryRead:
    return testcase_service.create_test_case_directory(session, project_id, payload)


@router.get("/projects/{project_id}/test-cases", response_model=list[TestCaseRead])
def list_test_cases(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[TestCaseRead]:
    return testcase_service.list_test_cases(session, project_id)


@router.get("/test-cases/{test_case_id}", response_model=TestCaseRead)
def get_test_case(
    test_case_id: int,
    session: Session = Depends(get_session),
) -> TestCaseRead:
    return testcase_service.get_test_case_or_404(session, test_case_id)


@router.post(
    "/projects/{project_id}/test-cases",
    response_model=TestCaseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_test_case(
    project_id: int,
    payload: TestCaseCreate,
    session: Session = Depends(get_session),
) -> TestCaseRead:
    return testcase_service.create_test_case(session, project_id, payload)


@router.post(
    "/projects/{project_id}/test-cases/import",
    response_model=list[TestCaseRead],
    status_code=status.HTTP_201_CREATED,
)
def import_test_cases(
    project_id: int,
    payload: TestCaseImportRequest,
    session: Session = Depends(get_session),
) -> list[TestCaseRead]:
    return testcase_service.import_test_cases(session, project_id, payload.cases)


@router.patch("/test-cases/{test_case_id}", response_model=TestCaseRead)
def update_test_case(
    test_case_id: int,
    payload: TestCaseUpdate,
    session: Session = Depends(get_session),
) -> TestCaseRead:
    return testcase_service.update_test_case(session, test_case_id, payload)


@router.post("/test-cases/{test_case_id}/publish", response_model=TestCaseRead)
def publish_test_case(
    test_case_id: int,
    session: Session = Depends(get_session),
) -> TestCaseRead:
    return testcase_service.publish_case(session, test_case_id)


@router.get(
    "/projects/{project_id}/published-test-cases",
    response_model=list[TestCaseRead],
)
def list_published_test_cases(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[TestCaseRead]:
    return testcase_service.list_published_cases(session, project_id)
