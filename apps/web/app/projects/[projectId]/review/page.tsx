import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { ReviewEditor } from "../../../../components/review-editor";
import {
  addTestCaseReview,
  getProject,
  listProjectTestCases,
  publishTestCase,
  updateTestCase,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale } from "../../../../lib/i18n";
import type { StructuredTextField, TestCaseMutationPayload } from "../../../../lib/types";

type ProjectReviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<{
    caseId?: string;
    lang?: string | string[];
  }>;
};

function readFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function collectIndexedText(formData: FormData, prefix: string) {
  return Array.from(formData.entries())
    .filter(([key, value]) => key.startsWith(`${prefix}-`) && typeof value === "string")
    .sort(([left], [right]) => {
      const leftIndex = Number.parseInt(left.replace(`${prefix}-`, ""), 10);
      const rightIndex = Number.parseInt(right.replace(`${prefix}-`, ""), 10);
      return leftIndex - rightIndex;
    })
    .map(([, value]) => String(value).trim())
    .filter(Boolean);
}

function collectStructuredText(formData: FormData, prefix: string): StructuredTextField[] {
  return collectIndexedText(formData, prefix).map((text) => ({ text }));
}

function parseAutomationFlag(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "y", "是", "开启"].includes(normalized);
}

function parseTestCaseMutation(
  formData: FormData,
  locale: "en" | "zh",
): TestCaseMutationPayload {
  return {
    title:
      readFormText(formData, "title") ||
      (locale === "zh" ? "未命名测试用例" : "Untitled test case"),
    module: readFormText(formData, "module") || (locale === "zh" ? "通用" : "General"),
    feature: readFormText(formData, "feature") || (locale === "zh" ? "通用" : "General"),
    case_type: readFormText(formData, "caseType") || "functional",
    priority: readFormText(formData, "priority") || "medium",
    preconditions: collectIndexedText(formData, "precondition"),
    steps: collectStructuredText(formData, "step"),
    expected_results: collectStructuredText(formData, "expected-result"),
    tags: readFormText(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    automation_flag: parseAutomationFlag(readFormText(formData, "automationFlag")),
    automation_notes: readFormText(formData, "automationNotes") || null,
  };
}

export default async function ProjectReviewPage({
  params,
  searchParams,
}: ProjectReviewPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = normalizeLocale(resolvedSearchParams.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/review`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.reviewPage.eyebrow}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/review`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.reviewPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/review`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.reviewPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
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

  async function saveReviewDraft(formData: FormData) {
    "use server";

    if (!resolvedSearchParams.caseId) {
      return;
    }

    await updateTestCase(
      resolvedSearchParams.caseId,
      parseTestCaseMutation(formData, locale),
    );
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function approveReviewDraft() {
    "use server";

    if (!resolvedSearchParams.caseId) {
      return;
    }

    await addTestCaseReview(resolvedSearchParams.caseId, {
      reviewer_id: "web.reviewer",
      action: "approve",
      comment: locale === "zh" ? "已从评审工作台批准。" : "Approved from review workspace.",
    });
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function publishReviewDraft() {
    "use server";

    if (!resolvedSearchParams.caseId) {
      return;
    }

    await publishTestCase(resolvedSearchParams.caseId);
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  return (
    <AppShell currentPath={`/projects/${projectId}/review`} locale={locale} project={project}>
      <section className="page-header">
        <span className="eyebrow">{t.reviewPage.eyebrow}</span>
        <h2>{project.name}</h2>
        <p>{t.reviewPage.description}</p>
      </section>

      {testCaseList.kind === "unavailable" ? (
        <section>
          <p>{t.reviewPage.fallback}</p>
        </section>
      ) : null}

      {testCaseList.kind === "http-error" ? (
        <section>
          <p>{t.reviewPage.error}</p>
        </section>
      ) : null}

      {canRenderEditor ? (
        <ReviewEditor
          item={selectedItem}
          locale={locale}
          approveAction={approveReviewDraft}
          publishAction={publishReviewDraft}
          saveAction={saveReviewDraft}
        />
      ) : null}

      <section className="workspace-links" aria-label={t.reviewPage.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/test-cases`, locale)}
        >
          <span className="eyebrow">{t.reviewPage.queue}</span>
          <h3>{t.reviewPage.testCases}</h3>
          <p>{t.reviewPage.queueCopy}</p>
        </a>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/documents`, locale)}
        >
          <span className="eyebrow">{t.reviewPage.traceability}</span>
          <h3>{t.reviewPage.documentCenter}</h3>
          <p>{t.reviewPage.documentCopy}</p>
        </a>
      </section>
    </AppShell>
  );
}
