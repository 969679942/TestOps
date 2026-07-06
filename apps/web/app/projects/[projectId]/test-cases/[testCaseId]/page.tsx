import React from "react";

import { AppShell } from "../../../../../components/app-shell";
import { Breadcrumbs } from "../../../../../components/breadcrumbs";
import { PageDescription } from "../../../../../components/page-description";
import { TestCaseEditor } from "../../../../../components/test-case-editor";
import { TestCaseReviewPanel } from "../../../../../components/test-case-review-panel";
import { WorkflowSteps } from "../../../../../components/workflow-steps";
import { copy } from "../../../../../lib/copy";
import { countPendingReviewCases } from "../../../../../lib/project-workspace-metrics";
import { resolveTestCaseDetailStep } from "../../../../../lib/workflow-step-utils";
import {
  localizedHref,
  normalizeLocale,
  type LocaleSearchParams,
} from "../../../../../lib/i18n";
import { translateProjectName } from "../../../../../lib/project-display";
import {
  getProject,
  getTestCase,
  listProjectDocuments,
  listProjectTestCaseDirectories,
  listProjectTestCases,
  listTestCaseReviews,
} from "../../../../../lib/workspace-api";
import { loadOrThrow } from "../../../../../lib/server-load";

type TestCaseDetailPageProps = {
  params: Promise<{
    projectId: string;
    testCaseId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function TestCaseDetailPage({
  params,
  searchParams,
}: TestCaseDetailPageProps) {
  const { projectId, testCaseId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const [project, documents, directories, testCases, testCase, reviews] = await loadOrThrow(() =>
    Promise.all([
      getProject(projectId),
      listProjectDocuments(projectId),
      listProjectTestCaseDirectories(projectId),
      listProjectTestCases(projectId),
      getTestCase(testCaseId),
      listTestCaseReviews(testCaseId),
    ]),
  );

  const publishedCount = testCases.filter((item) => item.status === "published").length;
  const pendingReviewCount = countPendingReviewCases(testCases);
  const projectDisplayName = translateProjectName(project.name, locale);

  return (
    <AppShell
      currentPath={`/projects/${projectId}/test-cases`}
      locale={locale}
      project={project}
      testCaseCount={testCases.length}
      pendingReviewCount={pendingReviewCount}
    >
      <Breadcrumbs
        items={[
          { label: copy.projects, href: localizedHref("/", locale) },
          {
            label: projectDisplayName,
            href: localizedHref(`/projects/${projectId}`, locale),
          },
          {
            label: copy.testCases,
            href: localizedHref(`/projects/${projectId}/test-cases`, locale),
          },
          { label: testCase.title },
        ]}
      />

      <section className="page-header compact">
        <span className="eyebrow">{copy.testCaseDetailEyebrow}</span>
        <h2>{testCase.title}</h2>
        <PageDescription page="testCaseEdit" />
      </section>

      <WorkflowSteps
        projectId={projectId}
        currentStep={resolveTestCaseDetailStep(testCase.status)}
        documentCount={documents.length}
        testCaseCount={testCases.length}
        publishedCount={publishedCount}
      />

      <TestCaseEditor
        testCase={testCase}
        directories={directories}
        sidebarFooter={<TestCaseReviewPanel testCase={testCase} reviews={reviews} />}
      />
    </AppShell>
  );
}
