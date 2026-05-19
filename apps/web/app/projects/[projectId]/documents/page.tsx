import React from "react";
import { AppShell } from "../../../../components/app-shell";
import { DocumentTable } from "../../../../components/document-table";
import { getProject, listProjectDocuments } from "../../../../lib/api";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDocumentsPage({
  params,
}: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`}>
        <section className="page-header">
          <span className="eyebrow">Document Workspace</span>
          <h2>Project not found</h2>
          <p>The requested project is unavailable or no longer exists.</p>
        </section>
      </AppShell>
    );
  }

  const documentList = await listProjectDocuments(projectId);
  const documents = documentList.kind === "http-error" ? [] : documentList.documents;

  return (
    <AppShell currentPath={`/projects/${projectId}/documents`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Document Center</span>
        <h2>{project.name}</h2>
        <p>
          Manage PRD, Figma, and Swagger inputs so generation runs always have grounded source
          evidence.
        </p>
      </section>

      <section className="summary-grid" aria-label="Document summary">
        <article className="summary-card">
          <span className="eyebrow">Documents</span>
          <p className="summary-value">
            {documentList.kind === "http-error" ? "Unavailable" : documents.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Project Provider</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Prompt Profile</span>
          <p className="summary-value">{project.defaultPromptProfile}</p>
        </article>
      </section>

      {documentList.kind === "unavailable" ? (
        <section>
          <p>Showing fallback document data because the API is currently unavailable.</p>
        </section>
      ) : null}

      {documentList.kind === "http-error" ? (
        <section>
          <p>Documents are temporarily unavailable because the API returned an error.</p>
        </section>
      ) : null}

      <DocumentTable items={documents} />

      <section className="workspace-links" aria-label="Document follow-up">
        <a className="workspace-link" href={`/projects/${projectId}/generation-tasks`}>
          <span className="eyebrow">Next Step</span>
          <h3>Generation Tasks</h3>
          <p>Use queued runs to turn the current source set into draft test cases.</p>
        </a>
        <article className="workspace-link">
          <span className="eyebrow">Traceability</span>
          <h3>Source Visibility</h3>
          <p>
            Keep input names, locations, and parse readiness visible before drafts move into
            review.
          </p>
        </article>
      </section>
    </AppShell>
  );
}
