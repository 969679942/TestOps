import React from "react";
import { AppShell } from "../../../../components/app-shell";
import { getProject } from "../../../../lib/api";

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

  return (
    <AppShell currentPath={`/projects/${projectId}/documents`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Document Workspace</span>
        <h2>{project.name}</h2>
        <p>
          Task 7 scaffold for the project document area. Document inventory and card-based
          browsing stay out of scope until the dedicated follow-up lands.
        </p>
      </section>

      <section>
        <span className="eyebrow">Task 7 scaffold</span>
        <ul className="subtle-list">
          <li>Stable navigation into the project workspace.</li>
          <li>Clear placeholder copy for future document-management work.</li>
          <li>No document-center cards or Task 8 interactions yet.</li>
        </ul>
      </section>
    </AppShell>
  );
}
