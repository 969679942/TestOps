from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.generation import GenerationTask
from app.models.project import Project
from worker_app.tasks import generate as generate_module


class _FailingProvider:
    def generate_test_cases(self, request):
        raise RuntimeError("provider boom")


class _SuccessfulProvider:
    def generate_test_cases(self, request):
        return type(
            "ProviderResponse",
            (),
            {
                "provider": "cursor",
                "model": "cursor-default",
                "payload": {
                    "cases": [
                        {
                            "title": "Create order with saved card",
                            "steps": ["Open checkout", "Submit order"],
                            "expected_results": ["Order is created"],
                        }
                    ]
                },
            },
        )()


def test_generate_task_persists_provider_output_as_draft_cases(tmp_path, monkeypatch):
    from app.models.testcase import TestCase as TestCaseModel

    database_url = f"sqlite:///{tmp_path / 'worker-generate-success.sqlite'}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    Base.metadata.create_all(engine)

    with testing_session_local() as session:
        project = Project(name="Worker Success", code="worker-success")
        session.add(project)
        session.commit()
        session.refresh(project)

        task = GenerationTask(
            project_id=project.id,
            status="queued",
            provider="cursor",
            model="cursor-default",
            prompt_version="smoke",
            input_refs={"document_ids": [1]},
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        task_id = task.id

    monkeypatch.setattr(generate_module, "SessionLocal", testing_session_local)
    monkeypatch.setattr(
        generate_module,
        "resolve_provider",
        lambda *args, **kwargs: _SuccessfulProvider(),
    )

    result = generate_module.generate_test_cases(task_id)

    with testing_session_local() as session:
        persisted_task = session.get(GenerationTask, task_id)
        drafts = session.query(TestCaseModel).all()

    assert result["status"] == "completed"
    assert result["generated_case_count"] == 1
    assert persisted_task is not None
    assert persisted_task.status == "completed"
    assert len(drafts) == 1
    assert drafts[0].title == "Create order with saved card"
    assert drafts[0].status == "draft"
    assert drafts[0].steps == [{"text": "Open checkout"}, {"text": "Submit order"}]
    assert drafts[0].expected_results == [{"text": "Order is created"}]


def test_generate_task_marks_db_failed_and_reraises_provider_errors(tmp_path, monkeypatch):
    database_url = f"sqlite:///{tmp_path / 'worker-generate.sqlite'}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    Base.metadata.create_all(engine)

    with testing_session_local() as session:
        project = Project(name="Worker", code="worker")
        session.add(project)
        session.commit()
        session.refresh(project)

        task = GenerationTask(
            project_id=project.id,
            status="queued",
            provider="cursor",
            model="cursor-default",
            prompt_version="smoke",
            input_refs={"document_ids": [1]},
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        task_id = task.id

    monkeypatch.setattr(generate_module, "SessionLocal", testing_session_local)
    monkeypatch.setattr(generate_module, "resolve_provider", lambda *args, **kwargs: _FailingProvider())

    with pytest.raises(RuntimeError, match="provider boom"):
        generate_module.generate_test_cases(task_id)

    with testing_session_local() as session:
        persisted = session.get(GenerationTask, task_id)
        assert persisted is not None
        assert persisted.status == "failed"
        assert persisted.error_message == "provider boom"
        assert persisted.finished_at is not None
