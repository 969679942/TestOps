import React from "react";
import { AppShell } from "../../../components/app-shell";
import { ProjectSummary } from "../../../components/project-summary";
import { getProject, listProjectDocuments } from "../../../lib/api";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectWorkspacePage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}`}>
        <section className="page-header">
          <span className="eyebrow">Project Workspace</span>
          <h2>Project not found</h2>
          <p>The requested project is unavailable or no longer exists.</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}`}>
        <section className="page-header">
          <span className="eyebrow">Project Workspace</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API returned an error.</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}`}>
        <section className="page-header">
          <span className="eyebrow">Project Workspace</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API is unavailable.</p>
        </section>
      </AppShell>
    );
  }

  const documentList = await listProjectDocuments(projectId);
  const documents = documentList.kind === "http-error" ? [] : documentList.documents;

  return (
    <AppShell currentPath={`/projects/${projectId}`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Project Workspace</span>
        <h2>{project.name}</h2>
        <p>
          {project.description ??
            "This workspace will anchor source documents, generated drafts, and review activity."}
        </p>
      </section>

      <ProjectSummary
        project={project}
        documents={documents}
        documentsUnavailable={documentList.kind === "http-error"}
      />

      {documentList.kind === "http-error" ? (
        <section>
          <p>Source documents are temporarily unavailable because the API returned an error.</p>
        </section>
      ) : null}

      <section className="workspace-links" aria-label="Workspace sections">
        <a className="workspace-link" href={`/projects/${projectId}/documents`}>
          <span className="eyebrow">Document Center</span>
          <h3>Documents</h3>
          <p>Track source assets, version inputs, and keep evidence ready for generation.</p>
        </a>

        <a className="workspace-link" href={`/projects/${projectId}/generation-tasks`}>
          <span className="eyebrow">Generation Queue</span>
          <h3>Generation Tasks</h3>
          <p>Monitor provider runs, prompt profiles, and document inputs tied to each attempt.</p>
        </a>

        <article className="workspace-link">
          <span className="eyebrow">Coming Later</span>
          <h3>Review Workspace</h3>
          <p>
            Human review remains intentionally out of scope here until the dedicated Task 9
            workspace lands.
          </p>
        </article>
      </section>
    </AppShell>
  );
}
