from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class FailureReportContext:
    kind: str
    index_path: str
    summary: dict[str, object]


@dataclass(frozen=True)
class FailureAnalysisRequest:
    automation_run_id: int
    run_summary: dict[str, object]
    error_message: str
    report_path: str | None
    reports: list[FailureReportContext]


@dataclass(frozen=True)
class FailureAnalysisResult:
    classification: str
    confidence: float
    summary: str
    recommendations: list[str]
    should_rerun: bool


class FailureAnalysisProvider(Protocol):
    name: str
    model: str

    def analyze(self, request: FailureAnalysisRequest) -> FailureAnalysisResult:
        """Return a structured failure diagnosis for a failed automation run."""


class CodexFailureAnalysisProvider:
    name = "codex"

    def __init__(self, model: str = "codex-provider-boundary") -> None:
        self.model = model

    def analyze(self, request: FailureAnalysisRequest) -> FailureAnalysisResult:
        normalized_error = request.error_message.lower()
        report_summary = request.reports[0].summary if request.reports else {}
        failed_count = report_summary.get("failed", request.run_summary.get("failed"))

        if "locator" in normalized_error or "timeout" in normalized_error:
            return FailureAnalysisResult(
                classification="automation_issue",
                confidence=0.84,
                summary=(
                    "Codex provider boundary classified this as an automation stability "
                    f"issue from run #{request.automation_run_id}: {request.error_message}"
                ),
                recommendations=[
                    "Inspect the failing locator and page object method before rerun.",
                    "Use the report summary to confirm the failure is isolated to this case.",
                ],
                should_rerun=True,
            )

        if "assert" in normalized_error or "expected" in normalized_error:
            return FailureAnalysisResult(
                classification="business_regression",
                confidence=0.72,
                summary=(
                    "Codex provider boundary classified this as a likely behavior "
                    f"regression from run #{request.automation_run_id}."
                ),
                recommendations=[
                    "Compare the actual behavior with the published expected result.",
                    "Ask product or QA to confirm whether the expected behavior changed.",
                ],
                should_rerun=False,
            )

        if failed_count in {0, "0"}:
            return FailureAnalysisResult(
                classification="environment_issue",
                confidence=0.64,
                summary=(
                    "Codex provider boundary found an infrastructure-like failure "
                    "without a failed test count in the report summary."
                ),
                recommendations=[
                    "Check runner logs, browser startup, and environment availability.",
                    "Rerun only after confirming the environment is healthy.",
                ],
                should_rerun=True,
            )

        return FailureAnalysisResult(
            classification="needs_triage",
            confidence=0.58,
            summary=(
                "Codex provider boundary needs human triage because the error and "
                "report summary do not clearly identify the failure category."
            ),
            recommendations=[
                "Review the Allure report and captured runner error before rerun.",
            ],
            should_rerun=False,
        )
