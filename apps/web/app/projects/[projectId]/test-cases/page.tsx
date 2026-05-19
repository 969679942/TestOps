import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { TestCaseTable } from "../../../../components/test-case-table";
import { getProject, listProjectTestCases } from "../../../../lib/api";
import type { TestCaseRecord } from "../../../../lib/types";

type ProjectTestCasesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function getCounts(items: TestCaseRecord[]) {
  return {
    needsUpdate: items.filter((item) => item.status === "needs_update").length,
    automationCandidates: items.filter((item) => item.automationFlag).length,
  };
}

export default async function ProjectTestCasesPage({
  params,
}: ProjectTestCasesPageProps) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/test-cases`}>
        <section className="page-header">
          <span className="eyebrow">Test Case Library</span>
          <h2>Project not found</h2>
          <p>The requested project is unavailable or no longer exists.</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/test-cases`}>
        <section className="page-header">
          <span className="eyebrow">Test Case Library</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API returned an error.</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/test-cases`}>
        <section className="page-header">
          <span className="eyebrow">Test Case Library</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API is unavailable.</p>
        </section>
      </AppShell>
    );
  }

  const testCaseList = await listProjectTestCases(projectId);
  const items = testCaseList.kind === "http-error" ? [] : testCaseList.items;
  const counts = getCounts(items);
  const countsUnavailable = testCaseList.kind === "http-error";

  return (
    <AppShell currentPath={`/projects/${projectId}/test-cases`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Test Case Library</span>
        <h2>{project.name}</h2>
        <p>Browse generated drafts, spot review-ready coverage, and move cases into the editor.</p>
      </section>

      <section className="summary-grid" aria-label="Test case summary">
        <article className="summary-card">
          <span className="eyebrow">Drafts</span>
          <p className="summary-value">
            {testCaseList.kind === "http-error" ? "Unavailable" : items.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Needs Update</span>
          <p className="summary-value">
            {countsUnavailable ? "Unavailable" : counts.needsUpdate}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Automation Candidates</span>
          <p className="summary-value">
            {countsUnavailable ? "Unavailable" : counts.automationCandidates}
          </p>
        </article>
      </section>

      {testCaseList.kind === "unavailable" ? (
        <section>
          <p>Showing fallback test case data because the API is currently unavailable.</p>
        </section>
      ) : null}

      {testCaseList.kind === "http-error" ? (
        <section>
          <p>Test cases are temporarily unavailable because the API returned an error.</p>
        </section>
      ) : null}

      {countsUnavailable ? null : <TestCaseTable items={items} />}

      <section className="workspace-links" aria-label="Test case follow-up">
        <a className="workspace-link" href={`/projects/${projectId}/review`}>
          <span className="eyebrow">Next Step</span>
          <h3>Review Workspace</h3>
          <p>Open the editor to refine structured steps and expected results before approval.</p>
        </a>
        <a className="workspace-link" href={`/projects/${projectId}/generation-tasks`}>
          <span className="eyebrow">Generation Queue</span>
          <h3>Refresh Drafts</h3>
          <p>Return to generation runs when the current draft set needs broader source coverage.</p>
        </a>
      </section>
    </AppShell>
  );
}
