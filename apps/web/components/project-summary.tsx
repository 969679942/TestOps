import React from "react";
import { copy, formatValue, type Locale } from "../lib/i18n";
import type { DocumentAsset, ProjectRecord } from "../lib/types";

type ProjectSummaryProps = Readonly<{
  project: ProjectRecord;
  documents: DocumentAsset[];
  documentsUnavailable?: boolean;
  locale?: Locale;
}>;

export function ProjectSummary({
  project,
  documents,
  documentsUnavailable = false,
  locale = "en",
}: ProjectSummaryProps) {
  const t = copy[locale];

  return (
    <section className="summary-grid" aria-label={t.workspace.sections}>
      <article className="summary-card">
        <span className="eyebrow">{t.components.projectCode}</span>
        <p className="summary-value">{project.code}</p>
      </article>

      <article className="summary-card">
        <span className="eyebrow">{t.components.status}</span>
        <p className="summary-value">{formatValue(project.status, locale)}</p>
      </article>

      <article className="summary-card">
        <span className="eyebrow">{t.components.defaultProvider}</span>
        <p className="summary-value">{project.defaultProvider}</p>
      </article>

      <article className="summary-card">
        <span className="eyebrow">{t.components.sourceDocuments}</span>
        <p className="summary-value">
          {documentsUnavailable ? t.states.unavailable : documents.length}
        </p>
      </article>
    </section>
  );
}
