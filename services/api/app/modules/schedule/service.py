from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.automation import AutomationGeneration
from app.models.environment import Environment
from app.models.project import Project
from app.models.schedule import AutomationSchedule
from app.models.testcase import TestCase
from app.schemas.schedule import AutomationScheduleCreate, AutomationScheduleUpdate


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


def _get_schedule(session: Session, schedule_id: int) -> AutomationSchedule:
    schedule = session.scalar(
        select(AutomationSchedule).where(AutomationSchedule.id == schedule_id)
    )
    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation schedule not found",
        )
    return schedule


def _validate_references(
    session: Session,
    project_id: int,
    environment_id: int,
    generation_ids: list[int],
) -> None:
    environment = session.scalar(
        select(Environment).where(Environment.id == environment_id)
    )
    if environment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found",
        )

    if environment.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Automation schedule references must belong to the same project",
        )

    rows = list(
        session.execute(
            select(AutomationGeneration.id, TestCase.project_id)
            .join(TestCase, AutomationGeneration.test_case_id == TestCase.id)
            .where(AutomationGeneration.id.in_(generation_ids))
        )
    )
    referenced_ids = {row.id for row in rows}
    if referenced_ids != set(generation_ids) or any(
        row.project_id != project_id for row in rows
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Automation schedule references must belong to the same project",
        )


def create_schedule(
    session: Session,
    project_id: int,
    payload: AutomationScheduleCreate,
) -> AutomationSchedule:
    _get_project(session, project_id)
    _validate_references(
        session,
        project_id,
        payload.environment_id,
        payload.target_generation_ids,
    )

    schedule = AutomationSchedule(
        project_id=project_id,
        environment_id=payload.environment_id,
        name=payload.name,
        target_generation_ids=payload.target_generation_ids,
        cron_expression=payload.cron_expression,
        status=payload.status,
        next_run_at=payload.next_run_at,
    )
    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    return schedule


def list_project_schedules(
    session: Session,
    project_id: int,
) -> list[AutomationSchedule]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(AutomationSchedule)
            .where(AutomationSchedule.project_id == project_id)
            .order_by(AutomationSchedule.created_at.desc(), AutomationSchedule.id.desc())
        )
    )


def update_schedule(
    session: Session,
    schedule_id: int,
    payload: AutomationScheduleUpdate,
) -> AutomationSchedule:
    schedule = _get_schedule(session, schedule_id)
    update_data = payload.model_dump(exclude_unset=True)
    environment_id = update_data.get("environment_id", schedule.environment_id)
    target_generation_ids = update_data.get(
        "target_generation_ids",
        schedule.target_generation_ids,
    )
    if "environment_id" in update_data or "target_generation_ids" in update_data:
        _validate_references(
            session,
            schedule.project_id,
            environment_id,
            target_generation_ids,
        )

    for key, value in update_data.items():
        setattr(schedule, key, value)

    schedule.updated_at = _utcnow()
    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    return schedule
