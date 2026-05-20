import React from "react";

import { copy, type Locale } from "../lib/i18n";
import type { GenerationTaskRecord } from "../lib/types";

type GenerationTaskListProps = Readonly<{
  items: GenerationTaskRecord[];
  locale?: Locale;
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

export function GenerationTaskList({ items, locale = "en" }: GenerationTaskListProps) {
  const t = copy[locale].components;

  if (!items.length) {
    return (
      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.queue}</span>
            <h3>{t.generationTasks}</h3>
          </div>
          <p>{t.taskIntro}</p>
        </div>
        <p className="empty-copy">{t.noTasks}</p>
      </section>
    );
  }

  return (
    <section className="task-list" aria-label="Generation task list">
      {items.map((item) => (
        <article key={item.id} className="task-card">
          <div className="task-card-header">
            <div>
              <span className="eyebrow">{t.task} #{item.id}</span>
              <h3>{formatLabel(item.status)}</h3>
            </div>
            <span className="status-pill">{formatLabel(item.provider)}</span>
          </div>

          <dl className="task-meta">
            <div>
              <dt>{t.model}</dt>
              <dd>{item.model}</dd>
            </div>
            <div>
              <dt>{t.promptProfile}</dt>
              <dd>{item.promptVersion}</dd>
            </div>
            <div>
              <dt>{t.inputDocuments}</dt>
              <dd>{getDocumentCount(item.inputRefs)}</dd>
            </div>
            <div>
              <dt>{t.created}</dt>
              <dd>{item.createdAt}</dd>
            </div>
          </dl>

          {item.errorMessage ? <p className="task-error">{item.errorMessage}</p> : null}
        </article>
      ))}
    </section>
  );
}
