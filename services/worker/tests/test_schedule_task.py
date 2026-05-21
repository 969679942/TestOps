from __future__ import annotations

from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.automation import AutomationGeneration, AutomationRun
from app.models.environment import Environment
from app.models.project import Project
from app.models.schedule import AutomationSchedule
from app.models.testcase import TestCase
from worker_app.tasks import schedule as schedule_module


def _create_due_schedule(testing_session_local) -> int:
    with testing_session_local() as session:
        project = Project(name="Scheduled Runner", code="scheduled-runner")
        session.add(project)
        session.commit()
        session.refresh(project)

        environment = Environment(
            project_id=project.id,
            name="Scheduled Staging",
            code="staging",
            base_url="https://staging.schedule.example",
            api_base_url="https://api-staging.schedule.example",
            auth_profile="qa-staging",
            status="active",
        )
        session.add(environment)
        session.commit()
        session.refresh(environment)

        test_case = TestCase(
            project_id=project.id,
            title="Scheduled checkout",
            status="published",
            module="Checkout",
            feature="Order submission",
            case_type="functional",
            priority="high",
            preconditions=[],
            steps=[{"text": "Open checkout"}],
            expected_results=[{"text": "Order succeeds"}],
            tags=["schedule"],
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
            artifact_root="automation",
            artifact_paths={"spec": "automation/checkout.spec.ts"},
        )
        session.add(generation)
        session.commit()
        session.refresh(generation)

        schedule = AutomationSchedule(
            project_id=project.id,
            environment_id=environment.id,
            name="Hourly smoke",
            target_generation_ids=[generation.id],
            cron_expression="@hourly",
            status="active",
            next_run_at=datetime.fromisoformat("2026-05-21T10:00:00"),
        )
        session.add(schedule)
        session.commit()
        session.refresh(schedule)
        return schedule.id


def test_run_due_schedules_creates_scheduled_runs_and_dispatches_runner(
    tmp_path,
    monkeypatch,
):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'worker-schedule.sqlite'}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)
    schedule_id = _create_due_schedule(testing_session_local)
    dispatched_run_ids: list[int] = []

    monkeypatch.setattr(schedule_module, "SessionLocal", testing_session_local)
    monkeypatch.setattr(
        schedule_module.run_queued_automation,
        "delay",
        lambda run_id: dispatched_run_ids.append(run_id),
    )

    result = schedule_module.run_due_schedules("2026-05-21T10:00:00")

    with testing_session_local() as session:
        runs = session.query(AutomationRun).all()
        schedule = session.get(AutomationSchedule, schedule_id)

    assert result["created_run_ids"] == dispatched_run_ids
    assert len(runs) == 1
    assert runs[0].status == "queued"
    assert runs[0].trigger_mode == "scheduled"
    assert schedule is not None
    assert schedule.last_run_at == datetime.fromisoformat("2026-05-21T10:00:00")
    assert schedule.next_run_at == datetime.fromisoformat("2026-05-21T11:00:00")
