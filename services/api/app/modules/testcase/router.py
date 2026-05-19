from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.modules.testcase import service as testcase_service
from app.schemas.testcase import TestCaseCreate, TestCaseRead

router = APIRouter(tags=["testcases"])


@router.get("/projects/{project_id}/test-cases", response_model=list[TestCaseRead])
def list_test_cases(
    project_id: int,
    session: Session = Depends(get_session),
) -> list[TestCaseRead]:
    return testcase_service.list_test_cases(session, project_id)


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
