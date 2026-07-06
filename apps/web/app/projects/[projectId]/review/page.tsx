import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { PageDescription } from "../../../../components/page-description";
import { ReviewEditor } from "../../../../components/review-editor";
import {
  addTestCaseReview,
  getProject,
  listProjectTestCases,
  publishTestCase,
  updateTestCase,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale } from "../../../../lib/i18n";
import { translateProjectName } from "../../../../lib/project-display";
import { countPendingReviewCases } from "../../../../lib/project-workspace-metrics";
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
  return ["1", "true", "yes", "y", "on", "是", "开启"].includes(normalized);
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
    linked_requirement: readFormText(formData, "linkedRequirement") || null,
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

  const projectDisplayName = translateProjectName(project.name, locale);

  const testCaseList = await listProjectTestCases(projectId);
  const reviewCandidates =
    testCaseList.kind === "http-error"
      ? []
      : testCaseList.items.filter((item) => item.status !== "published");
  const pendingReviewCount =
    testCaseList.kind === "http-error" ? 0 : countPendingReviewCases(testCaseList.items);
  const fallbackReviewItem = reviewCandidates[0] ?? null;
  const selectedItem =
    testCaseList.kind === "http-error"
      ? null
      : resolvedSearchParams.caseId
        ? testCaseList.items.find((item) => String(item.id) === resolvedSearchParams.caseId) ?? null
        : fallbackReviewItem;
  const effectiveCaseId = selectedItem ? String(selectedItem.id) : null;
  const canRenderEditor = testCaseList.kind !== "http-error";

  async function saveReviewDraft(formData: FormData) {
    "use server";

    if (!effectiveCaseId) {
      return;
    }

    await updateTestCase(
      effectiveCaseId,
      parseTestCaseMutation(formData, locale),
    );
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  function readReviewComment(
    formData: FormData,
    fallbackZh: string,
    fallbackEn: string,
  ) {
    return readFormText(formData, "reviewComment") || (locale === "zh" ? fallbackZh : fallbackEn);
  }

  async function approveReviewDraft(formData: FormData) {
    "use server";

    if (!effectiveCaseId) {
      return;
    }

    await addTestCaseReview(effectiveCaseId, {
      reviewer_id: "web.reviewer",
      action: "approve",
      comment: readReviewComment(
        formData,
        "已从评审工作台批准。",
        "Approved from review workspace.",
      ),
    });
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function requestChangeReviewDraft(formData: FormData) {
    "use server";

    if (!effectiveCaseId) {
      return;
    }

    await addTestCaseReview(effectiveCaseId, {
      reviewer_id: "web.reviewer",
      action: "request_change",
      comment: readReviewComment(
        formData,
        "已从评审工作台退回修改。",
        "Requested changes from review workspace.",
      ),
    });
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function rejectReviewDraft(formData: FormData) {
    "use server";

    if (!effectiveCaseId) {
      return;
    }

    await addTestCaseReview(effectiveCaseId, {
      reviewer_id: "web.reviewer",
      action: "reject",
      comment: readReviewComment(
        formData,
        "已从评审工作台驳回。",
        "Rejected from review workspace.",
      ),
    });
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function publishReviewDraft() {
    "use server";

    if (!effectiveCaseId) {
      return;
    }

    await publishTestCase(effectiveCaseId);
    revalidatePath(`/projects/${projectId}/review`);
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  return (
    <AppShell
      currentPath={`/projects/${projectId}/review`}
      locale={locale}
      project={project}
      pendingReviewCount={pendingReviewCount}
    >
      <section className="page-header">
        <span className="eyebrow">{t.reviewPage.eyebrow}</span>
        <h2>{t.reviewPage.eyebrow}</h2>
        <p>当前项目：{projectDisplayName}。{t.reviewPage.description}</p>
        <PageDescription page="review" />
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
        <div className="review-stack">
          {reviewCandidates.length > 0 ? (
            <section className="data-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{t.reviewPage.queue}</span>
                  <h3>{t.reviewPage.testCases}</h3>
                </div>
                <p>{t.reviewPage.queueCopy}</p>
              </div>
              <div className="review-stack">
                {reviewCandidates.map((item) => {
                  const isSelected = selectedItem ? String(selectedItem.id) === String(item.id) : false;
                  return (
                    <a
                      key={item.id}
                      className="review-meta-card"
                      href={localizedHref(`/projects/${projectId}/review?caseId=${item.id}`, locale)}
                    >
                      <span className="eyebrow">{item.module || t.reviewPage.general}</span>
                      <p className="summary-value">{item.title || t.reviewPage.untitled}</p>
                      <p>
                        <span className="status-pill">
                          {item.status}
                        </span>
                        {" · "}
                        {item.feature || t.reviewPage.general}
                        {isSelected ? " · 当前评审中" : ""}
                      </p>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          <ReviewEditor
            item={selectedItem}
            locale={locale}
            approveAction={approveReviewDraft}
            requestChangeAction={requestChangeReviewDraft}
            rejectAction={rejectReviewDraft}
            publishAction={publishReviewDraft}
            saveAction={saveReviewDraft}
          />
        </div>
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
