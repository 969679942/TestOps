import React from "react";
import Link from "next/link";

import { ProjectArchiveBanner } from "../../../components/project-archive-banner";
import { AppShell } from "../../../components/app-shell";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { ProjectStatusAction } from "../../../components/project-status-action";
import { ProjectWorkspaceClient } from "../../../components/project-workspace-client";
import { copy } from "../../../lib/copy";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../lib/i18n";
import { translateProjectDescription, translateProjectName } from "../../../lib/project-display";
import {
  getProject,
  listProjectDocuments,
  listProjectTestCases,
} from "../../../lib/workspace-api";
import { loadOrThrow } from "../../../lib/server-load";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const [project, documents, testCases] = await loadOrThrow(() =>
    Promise.all([
      getProject(projectId),
      listProjectDocuments(projectId),
      listProjectTestCases(projectId),
    ]),
  );
  const projectDisplayName = translateProjectName(project.name, locale);
  const projectDescription =
    translateProjectDescription(project.description, locale) ?? copy.defaultProjectHint;

  return (
    <AppShell
      currentPath={`/projects/${projectId}`}
      locale={locale}
      project={project}
      testCaseCount={testCases.length}
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
        testCases={testCases}
      />

      {testCases.length > 0 ? (
        <section className="next-step-banner">
          <div>
            <span className="eyebrow">{copy.nextStepEyebrow}</span>
            <h3>{copy.nextStepTitle(testCases.length)}</h3>
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
