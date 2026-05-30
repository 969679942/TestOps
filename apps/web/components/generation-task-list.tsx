import React from "react";

import { copy, formatValue, type Locale } from "../lib/i18n";
import type { GenerationTaskRecord } from "../lib/types";

type GenerationTaskListProps = Readonly<{
  items: GenerationTaskRecord[];
  locale?: Locale;
}>;

function getDocumentCount(inputRefs: Record<string, unknown>) {
  const documentIds = inputRefs.document_ids;
  return Array.isArray(documentIds) ? documentIds.length : 0;
}

export function GenerationTaskList({ items, locale = "zh" }: GenerationTaskListProps) {
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
    <section className="task-list" aria-label={t.generationTasks}>
      {items.map((item) => (
        <article key={item.id} className="task-card">
          <div className="task-card-header">
            <div>
              <span className="eyebrow">{t.task} #{item.id}</span>
              <h3>{formatValue(item.status, locale)}</h3>
            </div>
            <span className="status-pill">{formatValue(item.provider, locale)}</span>
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
