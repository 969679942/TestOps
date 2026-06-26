import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { Breadcrumbs } from "../../../../components/breadcrumbs";
import { TestCaseListWorkspace } from "../../../../components/test-case-list-workspace";
import { WorkflowSteps } from "../../../../components/workflow-steps";
import { copy } from "../../../../lib/copy";
import {
  localizedHref,
  normalizeLocale,
  type LocaleSearchParams,
} from "../../../../lib/i18n";
import { translateProjectName } from "../../../../lib/project-display";
import { buildDirectoryTree } from "../../../../lib/test-case-directory-utils";
import {
  getProject,
  listProjectDocuments,
  listProjectTestCaseDirectories,
  listProjectTestCases,
} from "../../../../lib/workspace-api";
import { loadOrThrow } from "../../../../lib/server-load";

type TestCaseListPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<
    LocaleSearchParams & {
      generated?: string;
      imported?: string;
    }
  >;
};

export default async function TestCaseListPage({
  params,
  searchParams,
}: TestCaseListPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = normalizeLocale(resolvedSearchParams.lang);
  const { generated, imported } = resolvedSearchParams;

  const [project, documents, directories, testCases] = await loadOrThrow(() =>
    Promise.all([
      getProject(projectId),
      listProjectDocuments(projectId),
      listProjectTestCaseDirectories(projectId),
      listProjectTestCases(projectId),
    ]),
  );

  const publishedCount = testCases.filter((item) => item.status === "published").length;
  const projectDisplayName = translateProjectName(project.name, locale);

  return (
    <AppShell
      currentPath={`/projects/${projectId}/test-cases`}
      locale={locale}
      project={project}
      testCaseCount={testCases.length}
    >
      <Breadcrumbs
        items={[
          { label: copy.projects, href: localizedHref("/", locale) },
          {
            label: projectDisplayName,
            href: localizedHref(`/projects/${projectId}`, locale),
          },
          { label: copy.testCases },
        ]}
      />

      <section className="page-header">
        <span className="eyebrow">{copy.testCasePreviewEyebrow}</span>
        <h2>{projectDisplayName}</h2>
        <p>{copy.testCasePreviewHint}</p>
      </section>

      <WorkflowSteps
        projectId={projectId}
        currentStep={publishedCount > 0 ? "publish" : "preview"}
        documentCount={documents.length}
        testCaseCount={testCases.length}
        publishedCount={publishedCount}
      />

      <TestCaseListWorkspace
        projectId={projectId}
        testCases={testCases}
        directories={buildDirectoryTree(directories, testCases)}
        showGeneratedBanner={generated === "1"}
        importedCount={imported ? Number(imported) || 0 : 0}
      />
    </AppShell>
  );
}
