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
  const project = await getProject(projectId);

  if (!project) {
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

  const documents = await listProjectDocuments(projectId);

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

      <ProjectSummary project={project} documents={documents} />

      <section className="workspace-links" aria-label="Workspace sections">
        <a className="workspace-link" href={`/projects/${projectId}/documents`}>
          <span className="eyebrow">Document Center</span>
          <h3>Documents</h3>
          <p>Track source assets, version inputs, and keep evidence ready for generation.</p>
        </a>

        <article className="workspace-link">
          <span className="eyebrow">Next Up</span>
          <h3>Generation and Review</h3>
          <p>
            These workspaces are intentionally held for later tasks so the shell can stay
            focused and stable.
          </p>
        </article>
      </section>
    </AppShell>
  );
}
