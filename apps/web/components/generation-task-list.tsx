import React from "react";

import type { GenerationTaskRecord } from "../lib/types";

type GenerationTaskListProps = Readonly<{
  items: GenerationTaskRecord[];
}>;

function formatLabel(value: string) {
  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getDocumentCount(inputRefs: Record<string, unknown>) {
  const documentIds = inputRefs.document_ids;
  return Array.isArray(documentIds) ? documentIds.length : 0;
}

export function GenerationTaskList({ items }: GenerationTaskListProps) {
  if (!items.length) {
    return (
      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Queue</span>
            <h3>Generation tasks</h3>
          </div>
          <p>Run histories will appear here once a generation task is created.</p>
        </div>
        <p className="empty-copy">
          No generation tasks have been queued for this project yet.
        </p>
      </section>
    );
  }

  return (
    <section className="task-list" aria-label="Generation task list">
      {items.map((item) => (
        <article key={item.id} className="task-card">
          <div className="task-card-header">
            <div>
              <span className="eyebrow">Task #{item.id}</span>
              <h3>{formatLabel(item.status)}</h3>
            </div>
            <span className="status-pill">{formatLabel(item.provider)}</span>
          </div>

          <dl className="task-meta">
            <div>
              <dt>Model</dt>
              <dd>{item.model}</dd>
            </div>
            <div>
              <dt>Prompt Profile</dt>
              <dd>{item.promptVersion}</dd>
            </div>
            <div>
              <dt>Input Documents</dt>
              <dd>{getDocumentCount(item.inputRefs)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{item.createdAt}</dd>
            </div>
          </dl>

          {item.errorMessage ? <p className="task-error">{item.errorMessage}</p> : null}
        </article>
      ))}
    </section>
  );
}
