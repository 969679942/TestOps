import React from "react";

import type { TestCaseRecord } from "../lib/types";

type TestCaseTableProps = Readonly<{
  items: TestCaseRecord[];
}>;

function formatLabel(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function TestCaseTable({ items }: TestCaseTableProps) {
  return (
    <section className="data-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Draft Inventory</span>
          <h3>Test case drafts</h3>
        </div>
        <p>Keep generated cases visible before they move into human review and publishing.</p>
      </div>

      <div className="table-scroll">
        <table className="data-table" aria-label="Project test cases">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Module</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Review</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="table-detail">
                      {formatLabel(item.caseType, "Case")} for {item.feature}
                    </div>
                  </td>
                  <td>{item.module}</td>
                  <td>{formatLabel(item.priority, "Unspecified")}</td>
                  <td>
                    <span className="status-pill">
                      {formatLabel(item.status, "Draft")}
                    </span>
                  </td>
                  <td>
                    <a
                      className="table-link"
                      href={`/projects/${item.projectId}/review?caseId=${item.id}`}
                    >
                      Open review
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No generated test cases are available for review yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
