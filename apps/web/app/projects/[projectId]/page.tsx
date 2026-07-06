import React from "react";
import Link from "next/link";

import { PageDescription } from "../../../components/page-description";
import { ProjectArchiveBanner } from "../../../components/project-archive-banner";
import { AppShell } from "../../../components/app-shell";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { ProjectStatusAction } from "../../../components/project-status-action";
import { ProjectWorkspaceClient } from "../../../components/project-workspace-client";
import { copy } from "../../../lib/copy";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../lib/i18n";
import { translateProjectDescription, translateProjectName } from "../../../lib/project-display";
import {
  getProjectWorkspace,
  listProjectTestCases,
} from "../../../lib/workspace-api";
import { listProjectGenerationTasks } from "../../../lib/api";
import { computeProjectWorkspaceMetrics } from "../../../lib/project-workspace-metrics";
import { loadOrThrow } from "../../../lib/server-load";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<
    LocaleSearchParams & {
      mode?: "generate" | "import";
    }
  >;
};

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = normalizeLocale(resolvedSearchParams.lang);
  const defaultMode = resolvedSearchParams.mode === "import" ? "import" : "generate";
  const { project, documents } = await loadOrThrow(() => getProjectWorkspace(projectId));
  const [testCases, generationTasksResult] = await Promise.all([
    loadOrThrow(() => listProjectTestCases(projectId)),
    listProjectGenerationTasks(projectId),
  ]);
  const failedTasks =
    generationTasksResult.kind === "http-error" ? [] : generationTasksResult.tasks;
  const metrics = computeProjectWorkspaceMetrics(testCases, failedTasks);
  const testCaseCount = project.testCaseCount;
  const publishedCount = project.publishedCount;
  const projectDisplayName = translateProjectName(project.name, locale);
  const projectDescription =
    translateProjectDescription(project.description, locale) ?? copy.defaultProjectHint;

  return (
    <AppShell
      currentPath={`/projects/${projectId}`}
      locale={locale}
      project={project}
      testCaseCount={testCaseCount}
      pendingReviewCount={metrics.pendingReviewCount}
      failedTaskCount={metrics.failedTaskCount}
      contentWidth="wide"
    >
      <Breadcrumbs
        items={[
          { label: copy.projects, href: localizedHref("/", locale) },
          { label: projectDisplayName },
        ]}
      />

      <section className="page-header page-header-with-actions">
        <div className="page-header-copy">
          <span className="eyebrow">{copy.workspaceEyebrow}</span>
          <h2 className="page-title-truncate" title={projectDisplayName}>
            {projectDisplayName}
          </h2>
          <p>{projectDescription}</p>
          <PageDescription page="projectWorkspace" />
        </div>
        <ProjectStatusAction
          projectId={projectId}
          status={project.status as "active" | "archived"}
        />
      </section>

      {project.status === "archived" ? <ProjectArchiveBanner /> : null}

      <ProjectWorkspaceClient
        projectId={projectId}
        project={project}
        documents={documents}
        testCaseCount={testCaseCount}
        publishedCount={publishedCount}
        draftCount={metrics.draftCount}
        pendingReviewCount={metrics.pendingReviewCount}
        failedTaskCount={metrics.failedTaskCount}
        defaultMode={defaultMode}
      />

      {testCaseCount > 0 ? (
        <section className="next-step-banner">
          <div>
            <span className="eyebrow">{copy.nextStepEyebrow}</span>
            <h3>{copy.nextStepTitle(testCaseCount)}</h3>
            <p>{copy.nextStepHint}</p>
          </div>
          <Link
            className="button-primary"
            href={localizedHref(`/projects/${projectId}/test-cases`, locale)}
          >
            {copy.testCases}
          </Link>
        </section>
      ) : null}
    </AppShell>
  );
}
