from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.automation import AutomationGeneration, AutomationRun
from app.models.schedule import AutomationSchedule
from worker_app.celery_app import celery_app
from worker_app.tasks.run_automation import run_queued_automation


def _parse_now(now_iso: str | None) -> datetime:
    if now_iso is None:
        return datetime.now(UTC).replace(tzinfo=None)

    parsed = datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(UTC).replace(tzinfo=None)
    return parsed


def _advance_next_run_at(cron_expression: str, from_time: datetime) -> datetime:
    expression = cron_expression.strip().lower()
    if expression == "@daily":
        return from_time + timedelta(days=1)
    if expression == "@hourly":
        return from_time + timedelta(hours=1)
    if expression.startswith("*/") and expression.endswith(" * * * *"):
        minute_fragment = expression.split(" ", 1)[0].removeprefix("*/")
        try:
            return from_time + timedelta(minutes=max(1, int(minute_fragment)))
        except ValueError:
            return from_time + timedelta(hours=1)
    if expression == "0 * * * *":
        return from_time + timedelta(hours=1)
    return from_time + timedelta(hours=1)


@celery_app.task(name="automation.run_due_schedules")
def run_due_schedules(now_iso: str | None = None) -> dict[str, Any]:
    now = _parse_now(now_iso)
    session = SessionLocal()
    created_run_ids: list[int] = []

    try:
        schedules = list(
            session.scalars(
                select(AutomationSchedule)
                .where(AutomationSchedule.status == "active")
                .where(AutomationSchedule.next_run_at.is_not(None))
                .where(AutomationSchedule.next_run_at <= now)
                .order_by(AutomationSchedule.next_run_at, AutomationSchedule.id)
            )
        )

        for schedule in schedules:
            for generation_id in schedule.target_generation_ids:
                generation = session.get(AutomationGeneration, generation_id)
                if generation is None or generation.status != "completed":
                    continue

                run = AutomationRun(
                    automation_generation_id=generation.id,
                    status="queued",
                    trigger_mode="scheduled",
                    summary={},
                )
                session.add(run)
                session.flush()
                created_run_ids.append(run.id)
                run_queued_automation.delay(run.id)

            schedule.last_run_at = now
            schedule.next_run_at = _advance_next_run_at(schedule.cron_expression, now)
            session.add(schedule)

        session.commit()
        return {
            "checked_at": now.isoformat(),
            "schedule_count": len(schedules),
            "created_run_ids": created_run_ids,
        }
    finally:
        session.close()
