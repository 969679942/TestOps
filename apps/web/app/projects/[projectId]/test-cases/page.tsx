import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { TestCaseTable } from "../../../../components/test-case-table";
import {
  createAutomationFailureAnalysis,
  createAutomationGeneration,
  createAutomationRerun,
  createAutomationRun,
  getProject,
  listProjectAutomationFailureAnalyses,
  listProjectAutomationGenerations,
  listProjectAutomationRuns,
  listProjectPublishedTestCases,
  listProjectTestCases,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import type {
  AutomationFailureAnalysisRecord,
  AutomationGenerationRecord,
  AutomationRunRecord,
  TestCaseRecord,
} from "../../../../lib/types";

type ProjectTestCasesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

function getCounts(items: TestCaseRecord[]) {
  return {
    needsUpdate: items.filter((item) => item.status === "needs_update").length,
    automationCandidates: items.filter((item) => item.automationFlag).length,
  };
}

function getArtifactNames(paths: Record<string, unknown>) {
  return Object.values(paths)
    .filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    )
    .map((value) => String(value).split(/[\\/]/).at(-1) ?? String(value))
    .filter(Boolean);
}

function getLatestGenerationsByCase(items: AutomationGenerationRecord[]) {
  const latestByCase = new Map<string, AutomationGenerationRecord>();

  for (const item of items) {
    const testCaseId = String(item.testCaseId);
    const current = latestByCase.get(testCaseId);
    if (
      current === undefined ||
      Date.parse(item.createdAt) > Date.parse(current.createdAt)
    ) {
      latestByCase.set(testCaseId, item);
    }
  }

  return latestByCase;
}

function getLatestRunsByGeneration(items: AutomationRunRecord[]) {
  const latestByGeneration = new Map<string, AutomationRunRecord>();

  for (const item of items) {
    const generationId = String(item.automationGenerationId);
    const current = latestByGeneration.get(generationId);
    if (
      current === undefined ||
      Date.parse(item.createdAt) > Date.parse(current.createdAt)
    ) {
      latestByGeneration.set(generationId, item);
    }
  }

  return latestByGeneration;
}

function getLatestAnalysesByRun(items: AutomationFailureAnalysisRecord[]) {
  const latestByRun = new Map<string, AutomationFailureAnalysisRecord>();

  for (const item of items) {
    const runId = String(item.automationRunId);
    const current = latestByRun.get(runId);
    if (
      current === undefined ||
      Date.parse(item.createdAt) > Date.parse(current.createdAt)
    ) {
      latestByRun.set(runId, item);
    }
  }

  return latestByRun;
}

function getSummaryNumber(summary: Record<string, unknown>, key: string) {
  const value = summary[key];
  return typeof value === "number" || typeof value === "string" ? String(value) : null;
}

export default async function ProjectTestCasesPage({
  params,
  searchParams,
}: ProjectTestCasesPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/test-cases`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.testCasesPage.eyebrow}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/test-cases`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.testCasesPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/test-cases`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.testCasesPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const testCaseList = await listProjectTestCases(projectId);
  const publishedCaseList = await listProjectPublishedTestCases(projectId);
  const automationGenerationList = await listProjectAutomationGenerations(projectId);
  const automationRunList = await listProjectAutomationRuns(projectId);
  const automationFailureAnalysisList =
    await listProjectAutomationFailureAnalyses(projectId);
  const items = testCaseList.kind === "http-error" ? [] : testCaseList.items;
  const publishedItems =
    publishedCaseList.kind === "http-error" ? [] : publishedCaseList.items;
  const automationGenerations =
    automationGenerationList.kind === "http-error" ? [] : automationGenerationList.items;
  const automationRuns = automationRunList.kind === "http-error" ? [] : automationRunList.items;
  const automationFailureAnalyses =
    automationFailureAnalysisList.kind === "http-error"
      ? []
      : automationFailureAnalysisList.items;
  const latestGenerationsByCase = getLatestGenerationsByCase(automationGenerations);
  const latestRunsByGeneration = getLatestRunsByGeneration(automationRuns);
  const latestAnalysesByRun = getLatestAnalysesByRun(automationFailureAnalyses);
  const counts = getCounts(items);
  const countsUnavailable = testCaseList.kind === "http-error";
  const automationText =
    locale === "zh"
      ? {
          eyebrow: "自动化交接",
          title: "已发布用例自动化交接",
          copy: "已发布用例可以生成 Playwright + TypeScript + POM 自动化资产。",
          empty: "暂无可生成自动化资产的已发布用例。",
          action: "生成自动化",
        }
      : {
          eyebrow: "Automation handoff",
          title: "Published automation handoff",
          copy: "Published cases can generate Playwright + TypeScript + POM automation assets.",
          empty: "No published cases are ready for automation generation yet.",
          action: "Generate automation",
        };
  const artifactText =
    locale === "zh"
      ? {
          latest: "\u6700\u65b0\u81ea\u52a8\u5316\u4ea7\u7269",
          generated: "\u5df2\u751f\u6210",
          noArtifacts: "\u6682\u65e0\u4ea7\u7269\u8def\u5f84",
          latestRun: "\u6700\u65b0\u81ea\u52a8\u5316\u8fd0\u884c",
          run: "\u8fd0\u884c\u81ea\u52a8\u5316",
          trigger: "\u89e6\u53d1\u65b9\u5f0f",
          report: "\u62a5\u544a",
          passed: "\u901a\u8fc7",
          failed: "\u5931\u8d25",
          error: "\u5931\u8d25\u539f\u56e0",
          analyze: "\u5206\u6790\u5931\u8d25",
          analysis: "\u5931\u8d25\u5206\u6790",
          rerun: "\u521b\u5efa\u91cd\u8bd5",
          retryRecommended: "\u5efa\u8bae\u91cd\u8bd5",
          noRetry: "\u4e0d\u5efa\u8bae\u76f4\u63a5\u91cd\u8bd5",
        }
      : {
          latest: "Latest automation artifact",
          generated: "Generated",
          noArtifacts: "No artifact paths yet",
          latestRun: "Latest automation run",
          run: "Run automation",
          trigger: "Trigger",
          report: "Report",
          passed: "Passed",
          failed: "Failed",
          error: "Failure reason",
          analyze: "Analyze failure",
          analysis: "Failure analysis",
          rerun: "Create rerun",
          retryRecommended: "Retry recommended",
          noRetry: "No direct retry recommended",
        };

  async function generateAutomationAction(formData: FormData) {
    "use server";

    const value = formData.get("testCaseId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationGeneration(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function runAutomationAction(formData: FormData) {
    "use server";

    const value = formData.get("generationId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationRun(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function analyzeFailureAction(formData: FormData) {
    "use server";

    const value = formData.get("runId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationFailureAnalysis(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function createRerunAction(formData: FormData) {
    "use server";

    const value = formData.get("analysisId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationRerun(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  return (
    <AppShell
      currentPath={`/projects/${projectId}/test-cases`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{t.testCasesPage.eyebrow}</span>
        <h2>{project.name}</h2>
        <p>{t.testCasesPage.description}</p>
      </section>

      <section className="summary-grid" aria-label={t.testCasesPage.summary}>
        <article className="summary-card">
          <span className="eyebrow">{t.testCasesPage.drafts}</span>
          <p className="summary-value">
            {testCaseList.kind === "http-error" ? t.states.unavailable : items.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.testCasesPage.needsUpdate}</span>
          <p className="summary-value">
            {countsUnavailable ? t.states.unavailable : counts.needsUpdate}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.testCasesPage.automationCandidates}</span>
          <p className="summary-value">
            {countsUnavailable ? t.states.unavailable : counts.automationCandidates}
          </p>
        </article>
      </section>

      {testCaseList.kind === "unavailable" ? (
        <section>
          <p>{t.testCasesPage.fallback}</p>
        </section>
      ) : null}

      {testCaseList.kind === "http-error" ? (
        <section>
          <p>{t.testCasesPage.error}</p>
        </section>
      ) : null}

      {countsUnavailable ? null : <TestCaseTable items={items} locale={locale} />}

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{automationText.eyebrow}</span>
            <h3>{automationText.title}</h3>
          </div>
          <p>{automationText.copy}</p>
        </div>
        {publishedItems.length ? (
          <div className="automation-list">
            {publishedItems.map((item) => {
              const latestGeneration = latestGenerationsByCase.get(String(item.id));
              const artifactNames =
                latestGeneration === undefined
                  ? []
                  : getArtifactNames(latestGeneration.artifactPaths);
              const latestRun =
                latestGeneration === undefined
                  ? undefined
                  : latestRunsByGeneration.get(String(latestGeneration.id));
              const passedCount =
                latestRun === undefined ? null : getSummaryNumber(latestRun.summary, "passed");
              const failedCount =
                latestRun === undefined ? null : getSummaryNumber(latestRun.summary, "failed");
              const latestAnalysis =
                latestRun === undefined
                  ? undefined
                  : latestAnalysesByRun.get(String(latestRun.id));

              return (
                <article className="automation-card" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.module} / {item.feature}
                    </p>
                    {latestGeneration ? (
                      <div className="table-detail">
                        <strong>{artifactText.latest}</strong>
                        <p>
                          {latestGeneration.status} - {artifactText.generated}{" "}
                          {latestGeneration.completedAt ?? latestGeneration.createdAt}
                        </p>
                        <p>
                          {artifactNames.length
                            ? artifactNames.join(", ")
                            : artifactText.noArtifacts}
                        </p>
                        {latestRun ? (
                          <>
                            <p>
                              <strong>{artifactText.latestRun}</strong>: {latestRun.status} -{" "}
                              {artifactText.trigger} {latestRun.triggerMode}
                            </p>
                            {latestRun.reportPath ? (
                              <p>
                                {artifactText.report}: {latestRun.reportPath}
                              </p>
                            ) : null}
                            {passedCount || failedCount ? (
                              <p>
                                {passedCount ? `${artifactText.passed} ${passedCount}` : null}
                                {passedCount && failedCount ? " / " : null}
                                {failedCount ? `${artifactText.failed} ${failedCount}` : null}
                              </p>
                            ) : null}
                            {latestRun.errorMessage ? (
                              <p>
                                {artifactText.error}: {latestRun.errorMessage}
                              </p>
                            ) : null}
                            {latestAnalysis ? (
                              <>
                                <p>
                                  <strong>{artifactText.analysis}</strong>:{" "}
                                  {latestAnalysis.classification} · {latestAnalysis.provider}
                                </p>
                                <p>
                                  {latestAnalysis.shouldRerun
                                    ? artifactText.retryRecommended
                                    : artifactText.noRetry}
                                </p>
                                <p>{latestAnalysis.summary}</p>
                                {latestAnalysis.recommendations.length ? (
                                  <p>{latestAnalysis.recommendations[0]}</p>
                                ) : null}
                              </>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {latestGeneration ? (
                    <form action={runAutomationAction}>
                      <input
                        name="generationId"
                        type="hidden"
                        value={String(latestGeneration.id)}
                      />
                      <button className="secondary-button" type="submit">
                        {artifactText.run}
                      </button>
                    </form>
                  ) : null}
                  {latestRun?.status === "failed" ? (
                    <form action={analyzeFailureAction}>
                      <input name="runId" type="hidden" value={String(latestRun.id)} />
                      <button className="secondary-button" type="submit">
                        {artifactText.analyze}
                      </button>
                    </form>
                  ) : null}
                  {latestAnalysis?.shouldRerun ? (
                    <form action={createRerunAction}>
                      <input
                        name="analysisId"
                        type="hidden"
                        value={String(latestAnalysis.id)}
                      />
                      <button className="secondary-button" type="submit">
                        {artifactText.rerun}
                      </button>
                    </form>
                  ) : null}
                  <form action={generateAutomationAction}>
                    <input name="testCaseId" type="hidden" value={String(item.id)} />
                    <button className="secondary-button" type="submit">
                      {automationText.action}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-copy">{automationText.empty}</p>
        )}
      </section>

      <section className="workspace-links" aria-label={t.testCasesPage.followUp}>
        <a className="workspace-link" href={localizedHref(`/projects/${projectId}/review`, locale)}>
          <span className="eyebrow">{t.testCasesPage.nextStep}</span>
          <h3>{t.testCasesPage.reviewWorkspace}</h3>
          <p>{t.testCasesPage.reviewCopy}</p>
        </a>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/generation-tasks`, locale)}
        >
          <span className="eyebrow">{t.testCasesPage.generationQueue}</span>
          <h3>{t.testCasesPage.refreshDrafts}</h3>
          <p>{t.testCasesPage.refreshCopy}</p>
        </a>
      </section>
    </AppShell>
  );
}
