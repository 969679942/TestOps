export type WorkflowStepKey =
  | "project"
  | "upload"
  | "generate"
  | "edit"
  | "review"
  | "publish";

export function resolveTestCaseListStep(params: {
  publishedCount: number;
  testCaseCount: number;
}): WorkflowStepKey {
  if (params.publishedCount > 0) {
    return "publish";
  }
  if (params.testCaseCount > 0) {
    return "edit";
  }
  return "upload";
}

export function resolveTestCaseDetailStep(status: string): WorkflowStepKey {
  if (status === "published") {
    return "publish";
  }
  if (status === "approved") {
    return "review";
  }
  return "edit";
}
