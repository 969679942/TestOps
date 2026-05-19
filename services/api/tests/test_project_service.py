import pytest
from sqlalchemy.exc import IntegrityError

from app.modules.project import service as project_service
from app.schemas.project import ProjectCreate


class BrokenSession:
    def scalar(self, _query):
        return None

    def add(self, _project) -> None:
        pass

    def commit(self) -> None:
        raise IntegrityError("insert", {}, Exception("boom"))

    def rollback(self) -> None:
        pass


def test_create_project_propagates_unexpected_integrity_error():
    payload = ProjectCreate(name="Core Banking", code="core-banking")

    with pytest.raises(IntegrityError):
        project_service.create_project(BrokenSession(), payload)
