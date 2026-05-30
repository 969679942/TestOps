import Link from "next/link";

import { copy } from "../lib/copy";

type WorkflowStepsProps = Readonly<{
  projectId: string;
  currentStep: "upload" | "generate" | "preview" | "publish";
  documentCount: number;
  testCaseCount: number;
  publishedCount: number;
  generating?: boolean;
}>;

export function WorkflowSteps({
  projectId,
  currentStep,
  documentCount,
  testCaseCount,
  publishedCount,
  generating = false,
}: WorkflowStepsProps) {
  return (
    <section className="workflow-steps" aria-label="流程进度">
      <Link
        className={`workflow-step ${currentStep === "upload" ? "is-active" : ""} ${
          documentCount > 0 ? "is-done" : ""
        }`}
        href={`/projects/${projectId}`}
      >
        <span className="workflow-step-index">1</span>
        <span className="workflow-step-copy">
          <strong>{copy.stepUpload}</strong>
          <small>{copy.documentCountLabel(documentCount)}</small>
        </span>
      </Link>

      <div
        className={`workflow-step workflow-step-static ${
          currentStep === "generate" || generating ? "is-active" : ""
        } ${testCaseCount > 0 ? "is-done" : ""}`}
      >
        <span className="workflow-step-index">2</span>
        <span className="workflow-step-copy">
          <strong>{copy.stepGenerate}</strong>
          <small>{generating ? copy.generating : testCaseCount > 0 ? copy.generateDone : copy.generatePending}</small>
        </span>
      </div>

      <Link
        className={`workflow-step ${
          currentStep === "preview" || currentStep === "publish" ? "is-active" : ""
        }`}
        href={`/projects/${projectId}/test-cases`}
      >
        <span className="workflow-step-index">3</span>
        <span className="workflow-step-copy">
          <strong>{copy.stepPreview}</strong>
          <small>
            {testCaseCount} 条草稿
            {publishedCount > 0 ? copy.publishedSummary(publishedCount) : ""}
          </small>
        </span>
      </Link>
    </section>
  );
}
