import React from "react";
import type { DocumentAsset, ProjectRecord } from "../lib/types";

type ProjectSummaryProps = Readonly<{
  project: ProjectRecord;
  documents: DocumentAsset[];
  documentsUnavailable?: boolean;
}>;

function titleCase(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function ProjectSummary({
  project,
  documents,
  documentsUnavailable = false,
}: ProjectSummaryProps) {
  return (
    <section className="summary-grid" aria-label="Project summary">
      <article className="summary-card">
        <span className="eyebrow">Project Code</span>
        <p className="summary-value">{project.code}</p>
      </article>

      <article className="summary-card">
        <span className="eyebrow">Status</span>
        <p className="summary-value">{titleCase(project.status)}</p>
      </article>

      <article className="summary-card">
        <span className="eyebrow">Default Provider</span>
        <p className="summary-value">{project.defaultProvider}</p>
      </article>

      <article className="summary-card">
        <span className="eyebrow">Source Documents</span>
        <p className="summary-value">
          {documentsUnavailable ? "Unavailable" : documents.length}
        </p>
      </article>
    </section>
  );
}
