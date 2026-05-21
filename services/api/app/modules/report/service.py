from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.automation import AutomationGeneration, AutomationRun
from app.models.project import Project
from app.models.report import AutomationReport
from app.models.testcase import TestCase
from app.schemas.report import AutomationReportCreate


def _get_project(session: Session, project_id: int) -> Project:
    project = session.scalar(select(Project).where(Project.id == project_id))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def _get_run(session: Session, run_id: int) -> AutomationRun:
    run = session.scalar(select(AutomationRun).where(AutomationRun.id == run_id))
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation run not found",
        )
    return run


def create_report(
    session: Session,
    run_id: int,
    payload: AutomationReportCreate,
) -> AutomationReport:
    run = _get_run(session, run_id)
    report = AutomationReport(
        automation_run_id=run.id,
        kind=payload.kind,
        artifact_root=payload.artifact_root,
        index_path=payload.index_path,
        summary=payload.summary,
    )
    run.report_path = payload.index_path
    run.summary = payload.summary
    session.add(report)
    session.add(run)
    session.commit()
    session.refresh(report)
    return report


def list_project_reports(
    session: Session,
    project_id: int,
) -> list[AutomationReport]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(AutomationReport)
            .join(AutomationRun, AutomationReport.automation_run_id == AutomationRun.id)
            .join(
                AutomationGeneration,
                AutomationRun.automation_generation_id == AutomationGeneration.id,
            )
            .join(TestCase, AutomationGeneration.test_case_id == TestCase.id)
            .where(TestCase.project_id == project_id)
            .order_by(AutomationReport.created_at.desc(), AutomationReport.id.desc())
        )
    )
