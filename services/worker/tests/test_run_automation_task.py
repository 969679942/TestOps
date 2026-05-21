from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.automation import AutomationGeneration, AutomationRun
from app.models.project import Project
from app.models.testcase import TestCase
from worker_app.tasks import run_automation as run_module


def _create_queued_run(testing_session_local, tmp_path) -> int:
    with testing_session_local() as session:
        project = Project(name="Runner Project", code="runner-project")
        session.add(project)
        session.commit()
        session.refresh(project)

        test_case = TestCase(
            project_id=project.id,
            title="Submit checkout order",
            status="published",
            module="Checkout",
            feature="Order submission",
            case_type="functional",
            priority="high",
            preconditions=[],
            steps=[{"text": "Open checkout"}],
            expected_results=[{"text": "Order succeeds"}],
            tags=["checkout"],
            automation_flag=True,
        )
        session.add(test_case)
        session.commit()
        session.refresh(test_case)

        generation = AutomationGeneration(
            test_case_id=test_case.id,
            status="completed",
            framework="playwright",
            language="typescript",
            pattern="pom",
            artifact_root=str(tmp_path / "automation"),
            artifact_paths={"spec": str(tmp_path / "automation" / "checkout.spec.ts")},
        )
        session.add(generation)
        session.commit()
        session.refresh(generation)

        run = AutomationRun(
            automation_generation_id=generation.id,
            status="queued",
            trigger_mode="manual",
            summary={},
        )
        session.add(run)
        session.commit()
        session.refresh(run)
        return run.id


def test_run_automation_task_marks_run_passed_with_report_summary(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'worker-run-success.sqlite'}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)
    run_id = _create_queued_run(testing_session_local, tmp_path)

    monkeypatch.setattr(run_module, "SessionLocal", testing_session_local)
    monkeypatch.setattr(
        run_module,
        "run_playwright_automation",
        lambda **kwargs: run_module.RunnerResult(
            status="passed",
            report_path="automation/reports/run-1/index.html",
            summary={"passed": 1, "failed": 0},
            error_message=None,
        ),
    )

    result = run_module.run_queued_automation(run_id)

    with testing_session_local() as session:
        persisted = session.get(AutomationRun, run_id)

    assert result == {
        "automation_run_id": run_id,
        "status": "passed",
        "report_path": "automation/reports/run-1/index.html",
    }
    assert persisted is not None
    assert persisted.status == "passed"
    assert persisted.report_path == "automation/reports/run-1/index.html"
    assert persisted.summary == {"passed": 1, "failed": 0}
    assert persisted.error_message is None
    assert persisted.started_at is not None
    assert persisted.finished_at is not None


def test_run_automation_task_marks_run_failed_when_runner_errors(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'worker-run-failed.sqlite'}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)
    run_id = _create_queued_run(testing_session_local, tmp_path)

    def failing_runner(**kwargs):
        raise RuntimeError("playwright boom")

    monkeypatch.setattr(run_module, "SessionLocal", testing_session_local)
    monkeypatch.setattr(run_module, "run_playwright_automation", failing_runner)

    with pytest.raises(RuntimeError, match="playwright boom"):
        run_module.run_queued_automation(run_id)

    with testing_session_local() as session:
        persisted = session.get(AutomationRun, run_id)

    assert persisted is not None
    assert persisted.status == "failed"
    assert persisted.error_message == "playwright boom"
    assert persisted.started_at is not None
    assert persisted.finished_at is not None


def test_run_playwright_automation_invokes_playwright_with_allure_reporter(
    tmp_path,
    monkeypatch,
):
    spec_path = tmp_path / "automation" / "checkout.spec.ts"
    spec_path.parent.mkdir(parents=True)
    spec_path.write_text("import { test } from '@playwright/test';", encoding="utf-8")
    generation = AutomationGeneration(
        id=5,
        test_case_id=1,
        status="completed",
        framework="playwright",
        language="typescript",
        pattern="pom",
        artifact_root=str(tmp_path / "automation"),
        artifact_paths={"spec": str(spec_path)},
    )
    calls = []

    def fake_run(command, cwd, env, capture_output, text, check):
        calls.append(
            {
                "command": command,
                "cwd": cwd,
                "allure_results_dir": env.get("ALLURE_RESULTS_DIR"),
                "capture_output": capture_output,
                "text": text,
                "check": check,
            }
        )
        return type(
            "CompletedProcess",
            (),
            {
                "returncode": 0,
                "stdout": "1 passed",
                "stderr": "",
            },
        )()

    monkeypatch.setattr(run_module.subprocess, "run", fake_run)

    result = run_module.run_playwright_automation(run_id=9, generation=generation)

    assert result == run_module.RunnerResult(
        status="passed",
        report_path=str(tmp_path / "automation" / "runs" / "run-9" / "report" / "index.html"),
        summary={"exit_code": 0},
        error_message=None,
    )
    assert calls == [
        {
            "command": [
                "npx",
                "playwright",
                "test",
                str(spec_path),
                "--reporter=line,allure-playwright",
            ],
            "cwd": str(tmp_path / "automation"),
            "allure_results_dir": str(
                tmp_path / "automation" / "runs" / "run-9" / "allure-results"
            ),
            "capture_output": True,
            "text": True,
            "check": False,
        }
    ]
