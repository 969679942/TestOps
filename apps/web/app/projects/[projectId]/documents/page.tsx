import React from "react";
import { AppShell } from "../../../../components/app-shell";
import { getProject, listProjectDocuments } from "../../../../lib/api";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function titleCase(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function ProjectDocumentsPage({
  params,
}: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  const [project, documents] = await Promise.all([
    getProject(projectId),
    listProjectDocuments(projectId),
  ]);

  return (
    <AppShell currentPath={`/projects/${projectId}/documents`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Document Center</span>
        <h2>{project.name} documents</h2>
        <p>
          Keep PRDs, Figma flows, and API contracts visible before generation and review
          tooling lands.
        </p>
      </section>

      <section className="document-grid" aria-label="Project documents">
        {documents.length > 0 ? (
          documents.map((document) => (
            <article key={document.id} className="document-card">
              <h3>{document.name}</h3>
              <p>
                {titleCase(document.type)} source via {titleCase(document.sourceMode)}
              </p>
              <div className="document-meta">
                {document.sourceUri ?? "Stored internally without an external URI."}
              </div>
            </article>
          ))
        ) : (
          <article className="document-card">
            <h3>No documents yet</h3>
            <p>This workspace is ready for source ingestion once the document center arrives.</p>
          </article>
        )}
      </section>

      <section>
        <span className="eyebrow">What this page covers</span>
        <ul className="subtle-list">
          <li>Source visibility for the current project.</li>
          <li>Room for document-version workflows in the next task.</li>
          <li>Stable workspace navigation that other modules can build on.</li>
        </ul>
      </section>
    </AppShell>
  );
}
