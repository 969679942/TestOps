"use client";

import { TestCaseComposer } from "./test-case-composer";
import type { TestCaseRecord } from "../lib/workspace-api";

type TestCaseEditorProps = Readonly<{
  testCase: TestCaseRecord;
}>;

export function TestCaseEditor({ testCase }: TestCaseEditorProps) {
  return (
    <TestCaseComposer mode="edit" projectId={testCase.projectId} testCase={testCase} />
  );
}
