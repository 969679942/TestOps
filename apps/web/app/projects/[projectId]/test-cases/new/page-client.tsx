"use client";

import { TestCaseComposer } from "../../../../../components/test-case-composer";
import type { TestCaseDirectoryRecord } from "../../../../../lib/workspace-api";

type NewTestCasePageClientProps = Readonly<{
  projectId: string;
  directories: TestCaseDirectoryRecord[];
}>;

export function NewTestCasePageClient({
  projectId,
  directories,
}: NewTestCasePageClientProps) {
  return <TestCaseComposer mode="create" projectId={projectId} directories={directories} />;
}
