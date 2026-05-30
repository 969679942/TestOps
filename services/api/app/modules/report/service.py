from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import json
import urllib.request

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.automation import (
    AutomationDebugProposal,
    AutomationFailureAnalysis,
    AutomationGeneration,
    AutomationRun,
)
from app.models.data_setup import DataSetupExecution
from app.models.project import Project
from app.models.report import AutomationFinalReport, AutomationReport
from app.models.testcase import TestCase
from app.schemas.report import AutomationReportCreate


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


@dataclass(frozen=True)
class LarkPushPayload:
    title: str
    content: str
    summary: dict[str, object]


@dataclass(frozen=True)
class LarkPushResult:
    status: str
    error_message: str | None = None


class LarkNotifier:
    def __init__(self, webhook_url: str | None) -> None:
        self.webhook_url = webhook_url

    def push(self, payload: LarkPushPayload) -> LarkPushResult:
        if not self.webhook_url:
            return LarkPushResult(status="skipped", error_message="Lark webhook is not configured")

        body = json.dumps(
            {
                "msg_type": "text",
                "content": {
                    "text": f"{payload.title}\n\n{payload.content}",
                },
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            self.webhook_url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                if response.status >= 400:
                    return LarkPushResult(
                        status="failed",
                        error_message=f"Lark webhook returned HTTP {response.status}",
                    )
        except Exception as exc:
            return LarkPushResult(status="failed", error_message=str(exc))

        return LarkPushResult(status="sent")


def get_lark_notifier(_settings=settings) -> LarkNotifier:
    return LarkNotifier(_settings.lark_webhook_url)


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


def _get_final_report(session: Session, report_id: int) -> AutomationFinalReport:
    report = session.scalar(
        select(AutomationFinalReport).where(AutomationFinalReport.id == report_id)
    )
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation final report not found",
        )
    return report


def _get_run_project_and_case(
    session: Session,
    run: AutomationRun,
) -> tuple[Project, TestCase]:
    row = session.execute(
        select(Project, TestCase)
        .join(TestCase, TestCase.project_id == Project.id)
        .join(AutomationGeneration, AutomationGeneration.test_case_id == TestCase.id)
        .where(AutomationGeneration.id == run.automation_generation_id)
    ).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Automation run is not linked to a project test case",
        )
    return row[0], row[1]


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


def _latest_report(session: Session, run_id: int) -> AutomationReport | None:
    return session.scalar(
        select(AutomationReport)
        .where(AutomationReport.automation_run_id == run_id)
        .order_by(AutomationReport.created_at.desc(), AutomationReport.id.desc())
    )


def _latest_failure_analysis(
    session: Session,
    run_id: int,
) -> AutomationFailureAnalysis | None:
    return session.scalar(
        select(AutomationFailureAnalysis)
        .where(AutomationFailureAnalysis.automation_run_id == run_id)
        .order_by(
            AutomationFailureAnalysis.created_at.desc(),
            AutomationFailureAnalysis.id.desc(),
        )
    )


def _latest_debug_proposal(
    session: Session,
    analysis_id: int | None,
) -> AutomationDebugProposal | None:
    if analysis_id is None:
        return None
    return session.scalar(
        select(AutomationDebugProposal)
        .where(AutomationDebugProposal.automation_failure_analysis_id == analysis_id)
        .order_by(
            AutomationDebugProposal.created_at.desc(),
            AutomationDebugProposal.id.desc(),
        )
    )


def _list_data_setup_executions(
    session: Session,
    run_id: int,
) -> list[DataSetupExecution]:
    return list(
        session.scalars(
            select(DataSetupExecution)
            .where(DataSetupExecution.automation_run_id == run_id)
            .order_by(DataSetupExecution.created_at.desc(), DataSetupExecution.id.desc())
        )
    )


def create_final_report(
    session: Session,
    run_id: int,
) -> AutomationFinalReport:
    run = _get_run(session, run_id)
    project, test_case = _get_run_project_and_case(session, run)
    allure_report = _latest_report(session, run.id)
    failure_analysis = _latest_failure_analysis(session, run.id)
    debug_proposal = _latest_debug_proposal(
        session,
        failure_analysis.id if failure_analysis else None,
    )
    data_setup_executions = _list_data_setup_executions(session, run.id)
    allure_summary = allure_report.summary if allure_report else {}
    failure_summary = (
        {
            "classification": failure_analysis.classification,
            "confidence": failure_analysis.confidence,
            "should_rerun": failure_analysis.should_rerun,
        }
        if failure_analysis
        else None
    )
    debug_summary = (
        {
            "status": debug_proposal.status,
            "proposal_type": debug_proposal.proposal_type,
        }
        if debug_proposal
        else None
    )
    summary: dict[str, object] = {
        "run_status": run.status,
        "trigger_mode": run.trigger_mode,
        "allure": allure_summary,
        "failure_analysis": failure_summary,
        "debug_proposal": debug_summary,
        "data_setup_execution_count": len(data_setup_executions),
    }
    title = f"Final automation report - {test_case.title}"
    content = "\n".join(
        [
            f"# {title}",
            f"Project: {project.name}",
            f"Test case: {test_case.title}",
            f"Run status: {run.status}",
            f"Trigger mode: {run.trigger_mode}",
            f"Allure report: {allure_report.index_path if allure_report else 'Not available'}",
            f"Passed: {allure_summary.get('passed', 'n/a')}",
            f"Failed: {allure_summary.get('failed', 'n/a')}",
            (
                "Failure analysis: "
                f"{failure_analysis.classification if failure_analysis else 'Not available'}"
            ),
            (
                "Debug proposal: "
                f"{debug_proposal.status if debug_proposal else 'Not available'}"
            ),
            "Lark: ready to push after review.",
        ]
    )
    final_report = AutomationFinalReport(
        project_id=project.id,
        automation_run_id=run.id,
        status="ready",
        title=title,
        summary=summary,
        content=content,
        lark_status="pending",
    )
    session.add(final_report)
    session.commit()
    session.refresh(final_report)
    return final_report


def list_project_final_reports(
    session: Session,
    project_id: int,
) -> list[AutomationFinalReport]:
    _get_project(session, project_id)
    return list(
        session.scalars(
            select(AutomationFinalReport)
            .where(AutomationFinalReport.project_id == project_id)
            .order_by(
                AutomationFinalReport.created_at.desc(),
                AutomationFinalReport.id.desc(),
            )
        )
    )


def push_final_report_to_lark(
    session: Session,
    report_id: int,
) -> AutomationFinalReport:
    final_report = _get_final_report(session, report_id)
    result = get_lark_notifier(settings).push(
        LarkPushPayload(
            title=final_report.title,
            content=final_report.content,
            summary=final_report.summary,
        )
    )
    final_report.lark_status = result.status
    final_report.lark_error = result.error_message
    final_report.pushed_at = _utcnow()
    session.add(final_report)
    session.commit()
    session.refresh(final_report)
    return final_report
