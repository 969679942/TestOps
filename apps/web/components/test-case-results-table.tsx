import Link from "next/link";

import { labelPriority } from "../lib/copy";
import type { TestCaseRecord } from "../lib/workspace-api";
import { StatusBadge } from "./status-badge";

type TestCaseResultsTableProps = Readonly<{
  projectId: string;
  items: TestCaseRecord[];
}>;

function formatCaseCode(id: string) {
  return /^\\d+$/.test(id) ? `TC-${id.padStart(4, "0")}` : `TC-${id}`;
}

function labelExecutionMode(testCase: TestCaseRecord) {
  return testCase.automationFlag ? "UI 自动化" : "手工测试";
}

export function TestCaseResultsTable({
  projectId,
  items,
}: TestCaseResultsTableProps) {
  return (
    <div className="table-scroll case-results-table-scroll">
      <table className="data-table case-results-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>编号</th>
            <th>结果</th>
            <th>用例等级</th>
            <th>执行方式</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((testCase) => (
            <tr key={testCase.id}>
              <td>
                <div className="table-detail">
                  <Link
                    className="table-link"
                    href={`/projects/${projectId}/test-cases/${testCase.id}`}
                  >
                    {testCase.title}
                  </Link>
                  <p>{testCase.module} / {testCase.feature}</p>
                </div>
              </td>
              <td>{formatCaseCode(testCase.id)}</td>
              <td>
                <StatusBadge status={testCase.status} />
              </td>
              <td>{labelPriority(testCase.priority)}</td>
              <td>{labelExecutionMode(testCase)}</td>
              <td>
                <div className="table-actions">
                  <Link
                    className="button-ghost"
                    href={`/projects/${projectId}/test-cases/${testCase.id}`}
                  >
                    查看
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
