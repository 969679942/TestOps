"use client";

import { TestCaseComposer } from "../../../../../components/test-case-composer";

type NewTestCasePageClientProps = Readonly<{
  projectId: string;
}>;

export function NewTestCasePageClient({ projectId }: NewTestCasePageClientProps) {
  return <TestCaseComposer mode="create" projectId={projectId} />;
}
