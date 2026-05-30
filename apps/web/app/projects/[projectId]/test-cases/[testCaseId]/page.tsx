import React from "react";
import { AppShell } from "../../../../../components/app-shell";
import { Breadcrumbs } from "../../../../../components/breadcrumbs";
import { TestCaseEditor } from "../../../../../components/test-case-editor";
import { TestCaseReviewPanel } from "../../../../../components/test-case-review-panel";
import { WorkflowSteps } from "../../../../../components/workflow-steps";
import { copy } from "../../../../../lib/copy";
import {
  getProject,
  getTestCase,
  listProjectDocuments,
  listProjectTestCases,
  listTestCaseReviews,
} from "../../../../../lib/workspace-api";
import { loadOrThrow } from "../../../../../lib/server-load";

type TestCaseDetailPageProps = {
  params: Promise<{
    projectId: string;
    testCaseId: string;
  }>;
};

export default async function TestCaseDetailPage({ params }: TestCaseDetailPageProps) {
  const { projectId, testCaseId } = await params;
  const [project, documents, testCases, testCase, reviews] = await loadOrThrow(() =>
    Promise.all([
      getProject(projectId),
      listProjectDocuments(projectId),
      listProjectTestCases(projectId),
      getTestCase(testCaseId),
      listTestCaseReviews(testCaseId),
    ]),
  );

  const publishedCount = testCases.filter((item) => item.status === "published").length;

  return (
    <AppShell
      currentPath={`/projects/${projectId}/test-cases`}
      project={project}
      testCaseCount={testCases.length}
    >
      <Breadcrumbs
        items={[
          { label: copy.projects, href: "/" },
          { label: project.name, href: `/projects/${projectId}` },
          { label: copy.testCases, href: `/projects/${projectId}/test-cases` },
          { label: testCase.title },
        ]}
      />

      <section className="page-header compact">
        <span className="eyebrow">{copy.testCaseDetailEyebrow}</span>
        <h2>{testCase.title}</h2>
      </section>

      <WorkflowSteps
        projectId={projectId}
        currentStep={testCase.status === "published" ? "publish" : "preview"}
        documentCount={documents.length}
        testCaseCount={testCases.length}
        publishedCount={publishedCount}
      />

      <div className="case-detail-layout">
        <TestCaseEditor testCase={testCase} />
        <TestCaseReviewPanel testCase={testCase} reviews={reviews} />
      </div>
    </AppShell>
  );
}
