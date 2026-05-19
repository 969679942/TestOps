import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { ReviewEditor } from "../../../../components/review-editor";
import { getProject, listProjectTestCases } from "../../../../lib/api";

type ProjectReviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<{
    caseId?: string;
  }>;
};

export default async function ProjectReviewPage({
  params,
  searchParams,
}: ProjectReviewPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/review`}>
        <section className="page-header">
          <span className="eyebrow">Review Workspace</span>
          <h2>Project not found</h2>
          <p>The requested project is unavailable or no longer exists.</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/review`}>
        <section className="page-header">
          <span className="eyebrow">Review Workspace</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API returned an error.</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/review`}>
        <section className="page-header">
          <span className="eyebrow">Review Workspace</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API is unavailable.</p>
        </section>
      </AppShell>
    );
  }

  const testCaseList = await listProjectTestCases(projectId);
  const selectedItem =
    resolvedSearchParams.caseId && testCaseList.kind !== "http-error"
      ? testCaseList.items.find((item) => String(item.id) === resolvedSearchParams.caseId) ?? null
      : null;
  const canRenderEditor = testCaseList.kind !== "http-error";

  return (
    <AppShell currentPath={`/projects/${projectId}/review`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Review Workspace</span>
        <h2>{project.name}</h2>
        <p>Review and refine generated test cases before they move into approval and publishing.</p>
      </section>

      {testCaseList.kind === "unavailable" ? (
        <section>
          <p>Showing fallback review data because the API is currently unavailable.</p>
        </section>
      ) : null}

      {testCaseList.kind === "http-error" ? (
        <section>
          <p>Test cases are temporarily unavailable because the API returned an error.</p>
        </section>
      ) : null}

      {canRenderEditor ? <ReviewEditor item={selectedItem} /> : null}

      <section className="workspace-links" aria-label="Review follow-up">
        <a className="workspace-link" href={`/projects/${projectId}/test-cases`}>
          <span className="eyebrow">Queue</span>
          <h3>Test Cases</h3>
          <p>Pick a generated draft from the library when you are ready to start a review pass.</p>
        </a>
        <a className="workspace-link" href={`/projects/${projectId}/documents`}>
          <span className="eyebrow">Traceability</span>
          <h3>Document Center</h3>
          <p>Check the current source evidence when a reviewer needs to confirm input coverage.</p>
        </a>
      </section>
    </AppShell>
  );
}
