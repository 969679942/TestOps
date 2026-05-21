from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
import os
import subprocess
from typing import Any

from app.core.database import SessionLocal
from app.models.automation import AutomationGeneration, AutomationRun
from worker_app.celery_app import celery_app


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


@dataclass(frozen=True)
class RunnerResult:
    status: str
    report_path: str | None
    summary: dict[str, Any]
    error_message: str | None = None


def run_playwright_automation(
    *,
    run_id: int,
    generation: AutomationGeneration,
) -> RunnerResult:
    spec_path = generation.artifact_paths.get("spec")
    if not isinstance(spec_path, str) or not spec_path:
        raise RuntimeError("Automation generation does not include a spec artifact.")

    artifact_root = Path(generation.artifact_root or Path(spec_path).parent)
    run_root = artifact_root / "runs" / f"run-{run_id}"
    report_path = run_root / "report" / "index.html"
    allure_results_dir = run_root / "allure-results"
    allure_results_dir.mkdir(parents=True, exist_ok=True)
    (run_root / "report").mkdir(parents=True, exist_ok=True)

    completed = subprocess.run(
        [
            "npx",
            "playwright",
            "test",
            spec_path,
            "--reporter=line,allure-playwright",
        ],
        cwd=str(artifact_root),
        env={**os.environ, "ALLURE_RESULTS_DIR": str(allure_results_dir)},
        capture_output=True,
        text=True,
        check=False,
    )
    error_message = None
    if completed.returncode != 0:
        error_message = (
            next((line for line in completed.stderr.splitlines() if line.strip()), None)
            or next((line for line in completed.stdout.splitlines() if line.strip()), None)
            or "Playwright exited with a non-zero status."
        )

    return RunnerResult(
        status="passed" if completed.returncode == 0 else "failed",
        report_path=str(report_path),
        summary={"exit_code": completed.returncode},
        error_message=error_message,
    )


@celery_app.task(name="automation.run_queued")
def run_queued_automation(automation_run_id: int) -> dict[str, Any]:
    session = SessionLocal()
    run: AutomationRun | None = None

    try:
        run = session.get(AutomationRun, automation_run_id)
        if run is None:
            return {
                "automation_run_id": automation_run_id,
                "status": "missing",
                "message": "Automation run not found.",
            }

        generation = session.get(AutomationGeneration, run.automation_generation_id)
        if generation is None:
            run.status = "failed"
            run.started_at = run.started_at or _utcnow()
            run.finished_at = _utcnow()
            run.error_message = "Automation generation not found."
            session.commit()
            return {
                "automation_run_id": automation_run_id,
                "status": run.status,
                "report_path": run.report_path,
            }

        run.status = "running"
        run.started_at = run.started_at or _utcnow()
        run.error_message = None
        session.commit()

        result = run_playwright_automation(run_id=run.id, generation=generation)

        run.status = result.status
        run.report_path = result.report_path
        run.summary = result.summary
        run.error_message = result.error_message
        run.finished_at = _utcnow()
        session.commit()

        return {
            "automation_run_id": run.id,
            "status": run.status,
            "report_path": run.report_path,
        }
    except Exception as exc:
        if run is not None:
            run.status = "failed"
            run.started_at = run.started_at or _utcnow()
            run.finished_at = _utcnow()
            run.error_message = str(exc)
            session.commit()
        raise
    finally:
        session.close()
