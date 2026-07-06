import type { TestCaseRecord } from "./workspace-api";

export function canDeleteTestCase(testCase: TestCaseRecord): {
  allowed: boolean;
  reason?: "published_test_case";
} {
  if (testCase.status === "published") {
    return { allowed: false, reason: "published_test_case" };
  }
  return { allowed: true };
}

export function canDeleteDirectory(params: {
  hasChildren: boolean;
  testCaseCount: number;
}): { allowed: boolean; reason?: "directory_not_empty" } {
  if (params.hasChildren || params.testCaseCount > 0) {
    return { allowed: false, reason: "directory_not_empty" };
  }
  return { allowed: true };
}
