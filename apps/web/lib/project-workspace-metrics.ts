import type { GenerationTaskRecord } from "./types";
import type { TestCaseRecord } from "./workspace-api";

export function countPendingReviewCases(testCases: TestCaseRecord[]) {
  return testCases.filter((item) =>
    item.status === "draft" || item.status === "needs_update" || item.status === "approved",
  ).length;
}

export function countDraftCases(testCases: TestCaseRecord[]) {
  return testCases.filter((item) => item.status === "draft" || item.status === "needs_update").length;
}

export function countFailedGenerationTasks(tasks: GenerationTaskRecord[]) {
  return tasks.filter((item) => item.status === "failed").length;
}

export function computeProjectWorkspaceMetrics(
  testCases: TestCaseRecord[],
  tasks: GenerationTaskRecord[] = [],
) {
  return {
    draftCount: countDraftCases(testCases),
    pendingReviewCount: countPendingReviewCases(testCases),
    failedTaskCount: countFailedGenerationTasks(tasks),
  };
}
