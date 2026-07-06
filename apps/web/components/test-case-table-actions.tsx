"use client";

import Link from "next/link";

import { canDeleteTestCase } from "../lib/delete-guards";
import { deleteBlockMessage } from "../lib/design-spec-copy";
import type { TestCaseRecord } from "../lib/workspace-api";

type TestCaseTableActionsProps = Readonly<{
  projectId: string;
  testCase: TestCaseRecord;
}>;

export function TestCaseTableActions({ projectId, testCase }: TestCaseTableActionsProps) {
  const deleteGuard = canDeleteTestCase(testCase);

  return (
    <div className="table-actions">
      <Link
        className="button-ghost"
        href={`/projects/${projectId}/test-cases/${testCase.id}`}
      >
        编辑
      </Link>
      <Link
        className="button-ghost"
        href={`/projects/${projectId}/review?caseId=${testCase.id}`}
      >
        评审
      </Link>
      {!deleteGuard.allowed && deleteGuard.reason ? (
        <span
          className="button-ghost button-ghost-disabled"
          title={deleteBlockMessage(deleteGuard.reason)}
        >
          删除
        </span>
      ) : null}
    </div>
  );
}
