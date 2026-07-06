import Link from "next/link";

import { labelPriority, statusLabels } from "../lib/copy";
import type { TestCaseRecord } from "../lib/workspace-api";
import { StatusBadge } from "./status-badge";
import { TestCaseTableActions } from "./test-case-table-actions";

type TestCaseResultsTableProps = Readonly<{
  projectId: string;
  items: TestCaseRecord[];
}>;

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stepCount(testCase: TestCaseRecord) {
  return testCase.steps?.length ?? 0;
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
            <th className="col-text">用例标题</th>
            <th className="col-text">模块</th>
            <th className="col-text">功能点</th>
            <th className="col-text">优先级</th>
            <th className="col-text">状态</th>
            <th className="col-num">步骤数</th>
            <th className="col-text">更新时间</th>
            <th className="col-text">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((testCase) => (
            <tr key={testCase.id}>
              <td className="col-text">
                <Link
                  className="table-link cell-truncate"
                  href={`/projects/${projectId}/test-cases/${testCase.id}`}
                  title={testCase.title}
                >
                  {testCase.title}
                </Link>
              </td>
              <td className="col-text">
                {testCase.module ? (
                  <span className="cell-truncate" title={testCase.module}>
                    {testCase.module}
                  </span>
                ) : null}
              </td>
              <td className="col-text">
                {testCase.feature ? (
                  <span className="cell-truncate" title={testCase.feature}>
                    {testCase.feature}
                  </span>
                ) : null}
              </td>
              <td className="col-text">{labelPriority(testCase.priority)}</td>
              <td className="col-text">
                <StatusBadge status={testCase.status} />
              </td>
              <td className="col-num">{stepCount(testCase)}</td>
              <td className="col-text">{formatUpdatedAt(testCase.updatedAt)}</td>
              <td className="col-text">
                <TestCaseTableActions projectId={projectId} testCase={testCase} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function summarizeTestCaseStatuses(items: TestCaseRecord[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function formatStatusSummary(counts: Record<string, number>) {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${statusLabels[status as keyof typeof statusLabels] ?? status} ${count}`)
    .join(" · ");
}
