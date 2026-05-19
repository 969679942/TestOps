import React from "react";

import type { DocumentAsset } from "../lib/types";

type DocumentTableProps = Readonly<{
  items: DocumentAsset[];
}>;

function formatLabel(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function DocumentTable({ items }: DocumentTableProps) {
  return (
    <section className="data-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Source Inventory</span>
          <h3>Document assets</h3>
        </div>
        <p>PRD, Figma, and Swagger inputs stay visible here before each generation run.</p>
      </div>

      <div className="table-scroll">
        <table className="data-table" aria-label="Project documents">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Source</th>
              <th scope="col">Parse Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{formatLabel(item.type, "Unknown")}</td>
                  <td>{item.sourceUri ?? "Stored in workspace"}</td>
                  <td>
                    <span className="status-pill">
                      {formatLabel(item.parseStatus, "Pending parse")}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty-cell">
                  No source documents have been attached to this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
