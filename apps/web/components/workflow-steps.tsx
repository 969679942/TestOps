import Link from "next/link";

import { copy } from "../lib/copy";
import { workflowStepLabels } from "../lib/design-spec-copy";

type WorkflowStepKey =
  | "project"
  | "upload"
  | "generate"
  | "edit"
  | "review"
  | "publish";

type WorkflowStepsProps = Readonly<{
  projectId: string;
  currentStep: WorkflowStepKey;
  documentCount: number;
  testCaseCount: number;
  publishedCount: number;
  draftCount?: number;
  generating?: boolean;
}>;

function resolveStepState(
  step: WorkflowStepKey,
  currentStep: WorkflowStepKey,
  metrics: {
    documentCount: number;
    testCaseCount: number;
    publishedCount: number;
  },
) {
  const order = workflowStepLabels.map((item) => item.key);
  const currentIndex = order.indexOf(currentStep);
  const stepIndex = order.indexOf(step);

  const done =
    (step === "upload" && metrics.documentCount > 0) ||
    (step === "generate" && metrics.testCaseCount > 0) ||
    (step === "edit" && metrics.testCaseCount > 0) ||
    (step === "review" && metrics.testCaseCount > 0) ||
    (step === "publish" && metrics.publishedCount > 0) ||
    stepIndex < currentIndex;

  const active = step === currentStep;

  return { done, active };
}

function stepHref(projectId: string, step: WorkflowStepKey) {
  switch (step) {
    case "project":
      return "/";
    case "upload":
      return `/projects/${projectId}`;
    case "generate":
      return `/projects/${projectId}`;
    case "edit":
      return `/projects/${projectId}/test-cases`;
    case "review":
      return `/projects/${projectId}/review`;
    case "publish":
      return `/projects/${projectId}/review`;
  }
}

function stepDetail(
  step: WorkflowStepKey,
  metrics: {
    documentCount: number;
    testCaseCount: number;
    publishedCount: number;
    generating: boolean;
  },
) {
  switch (step) {
    case "project":
      return "已进入项目";
    case "upload":
      return copy.documentCountLabel(metrics.documentCount);
    case "generate":
      return metrics.generating
        ? copy.generating
        : metrics.testCaseCount > 0
          ? copy.generateDone
          : copy.generatePending;
    case "edit":
      return `${metrics.testCaseCount} 条草稿`;
    case "review":
      return metrics.testCaseCount > 0 ? "可进入评审" : "暂无用例";
    case "publish":
      return metrics.publishedCount > 0
        ? copy.publishedSummary(metrics.publishedCount)
        : "待发布";
  }
}

export function WorkflowSteps({
  projectId,
  currentStep,
  documentCount,
  testCaseCount,
  publishedCount,
  generating = false,
}: WorkflowStepsProps) {
  const metrics = { documentCount, testCaseCount, publishedCount, generating };

  return (
    <section className="workflow-steps workflow-steps--extended" aria-label="流程进度">
      {workflowStepLabels.map((step, index) => {
        const { done, active } = resolveStepState(step.key, currentStep, metrics);
        const className = `workflow-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`;
        const content = (
          <>
            <span className="workflow-step-index">{index + 1}</span>
            <span className="workflow-step-copy">
              <strong>{step.label}</strong>
              <small>{stepDetail(step.key, metrics)}</small>
            </span>
          </>
        );

        if (step.key === "generate") {
          return (
            <div className={`${className} workflow-step-static`} key={step.key}>
              {content}
            </div>
          );
        }

        return (
          <Link className={className} href={stepHref(projectId, step.key)} key={step.key}>
            {content}
          </Link>
        );
      })}
    </section>
  );
}
