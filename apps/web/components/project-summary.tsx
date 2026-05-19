import React from "react";
import type { ProjectDocumentRecord, ProjectRecord } from "../lib/api";

type ProjectSummaryProps = Readonly<{
  project: ProjectRecord;
  documents: ProjectDocumentRecord[];
}>;

function titleCase(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function ProjectSummary({ project, documents }: ProjectSummaryProps) {
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
        <p className="summary-value">{documents.length}</p>
      </article>
    </section>
  );
}
