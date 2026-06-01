"use client";

import { TestCaseComposer } from "./test-case-composer";
import type {
  TestCaseDirectoryRecord,
  TestCaseRecord,
} from "../lib/workspace-api";
import type { ReactNode } from "react";

type TestCaseEditorProps = Readonly<{
  testCase: TestCaseRecord;
  directories: TestCaseDirectoryRecord[];
  sidebarFooter?: ReactNode;
}>;

export function TestCaseEditor({
  testCase,
  directories,
  sidebarFooter,
}: TestCaseEditorProps) {
  return (
    <TestCaseComposer
      mode="edit"
      projectId={testCase.projectId}
      directories={directories}
      testCase={testCase}
      sidebarFooter={sidebarFooter}
    />
  );
}
