import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { TestCaseTable } from "../../../../components/test-case-table";
import {
  createAutomationFailureAnalysis,
  createAutomationDebugProposal,
  createAutomationDebugProposalRerun,
  createAutomationFinalReport,
  createAutomationGeneration,
  createAutomationRun,
  getProject,
  listProjectAutomationDebugProposals,
  listProjectAutomationFinalReports,
  listProjectAutomationFailureAnalyses,
  listProjectAutomationGenerations,
  listProjectAutomationReports,
  listProjectAutomationRuns,
  listProjectDataSetupExecutions,
  listProjectDataSetupHints,
  listProjectPublishedTestCases,
  listProjectTestCases,
  pushAutomationFinalReportToLark,
  reviewAutomationDebugProposal,
} from "../../../../lib/api";
import {
  copy,
  formatValue,
  localizedHref,
  normalizeLocale,
  type LocaleSearchParams,
} from "../../../../lib/i18n";
import type {
  AutomationFailureAnalysisRecord,
  AutomationDebugProposalRecord,
  AutomationFinalReportRecord,
  AutomationGenerationRecord,
  AutomationReportRecord,
  AutomationRunRecord,
  DataSetupExecutionRecord,
  DataSetupHintRecord,
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

function getLatestDebugProposalsByAnalysis(items: AutomationDebugProposalRecord[]) {
  const latestByAnalysis = new Map<string, AutomationDebugProposalRecord>();

  for (const item of items) {
    const analysisId = String(item.automationFailureAnalysisId);
    const current = latestByAnalysis.get(analysisId);
    if (
      current === undefined ||
      Date.parse(item.createdAt) > Date.parse(current.createdAt)
    ) {
      latestByAnalysis.set(analysisId, item);
    }
  }

  return latestByAnalysis;
}

function getLatestReportsByRun(items: AutomationReportRecord[]) {
  const latestByRun = new Map<string, AutomationReportRecord>();

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

function getLatestFinalReportsByRun(items: AutomationFinalReportRecord[]) {
  const latestByRun = new Map<string, AutomationFinalReportRecord>();

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

function getDataSetupHintsByCase(items: DataSetupHintRecord[]) {
  const hintsByCase = new Map<string, DataSetupHintRecord[]>();

  for (const item of items) {
    const testCaseId = String(item.testCaseId);
    const current = hintsByCase.get(testCaseId) ?? [];
    hintsByCase.set(testCaseId, [...current, item]);
  }

  return hintsByCase;
}

function getLatestDataSetupExecutionsByHint(items: DataSetupExecutionRecord[]) {
  const latestByHint = new Map<string, DataSetupExecutionRecord>();

  for (const item of items) {
    const hintId = String(item.dataSetupHintId);
    const current = latestByHint.get(hintId);
    if (
      current === undefined ||
      Date.parse(item.createdAt) > Date.parse(current.createdAt)
    ) {
      latestByHint.set(hintId, item);
    }
  }

  return latestByHint;
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
  const automationReportList = await listProjectAutomationReports(projectId);
  const automationFinalReportList =
    await listProjectAutomationFinalReports(projectId);
  const automationFailureAnalysisList =
    await listProjectAutomationFailureAnalyses(projectId);
  const automationDebugProposalList =
    await listProjectAutomationDebugProposals(projectId);
  const dataSetupHintList = await listProjectDataSetupHints(projectId);
  const dataSetupExecutionList = await listProjectDataSetupExecutions(projectId);
  const items = testCaseList.kind === "http-error" ? [] : testCaseList.items;
  const publishedItems =
    publishedCaseList.kind === "http-error" ? [] : publishedCaseList.items;
  const automationGenerations =
    automationGenerationList.kind === "http-error" ? [] : automationGenerationList.items;
  const automationRuns = automationRunList.kind === "http-error" ? [] : automationRunList.items;
  const automationReports =
    automationReportList.kind === "http-error" ? [] : automationReportList.items;
  const automationFinalReports =
    automationFinalReportList.kind === "http-error"
      ? []
      : automationFinalReportList.items;
  const automationFailureAnalyses =
    automationFailureAnalysisList.kind === "http-error"
      ? []
      : automationFailureAnalysisList.items;
  const automationDebugProposals =
    automationDebugProposalList.kind === "http-error"
      ? []
      : automationDebugProposalList.items;
  const dataSetupHints =
    dataSetupHintList.kind === "http-error" ? [] : dataSetupHintList.hints;
  const dataSetupExecutions =
    dataSetupExecutionList.kind === "http-error"
      ? []
      : dataSetupExecutionList.executions;
  const latestGenerationsByCase = getLatestGenerationsByCase(automationGenerations);
  const latestRunsByGeneration = getLatestRunsByGeneration(automationRuns);
  const latestReportsByRun = getLatestReportsByRun(automationReports);
  const latestFinalReportsByRun = getLatestFinalReportsByRun(automationFinalReports);
  const latestAnalysesByRun = getLatestAnalysesByRun(automationFailureAnalyses);
  const latestDebugProposalsByAnalysis =
    getLatestDebugProposalsByAnalysis(automationDebugProposals);
  const dataSetupHintsByCase = getDataSetupHintsByCase(dataSetupHints);
  const latestDataSetupExecutionsByHint =
    getLatestDataSetupExecutionsByHint(dataSetupExecutions);
  const counts = getCounts(items);
  const countsUnavailable = testCaseList.kind === "http-error";
  const automationText = {
    eyebrow: t.testCasesPage.automationEyebrow,
    title: t.testCasesPage.automationTitle,
    copy: t.testCasesPage.automationCopy,
    empty: t.testCasesPage.automationEmpty,
    action: t.testCasesPage.generateAutomation,
  };
  const artifactText = t.artifacts;

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

  async function createDebugProposalAction(formData: FormData) {
    "use server";

    const value = formData.get("analysisId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationDebugProposal(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function approveDebugProposalAction(formData: FormData) {
    "use server";

    const value = formData.get("proposalId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await reviewAutomationDebugProposal(value.trim(), {
      action: "approve",
      reviewer_id: "web.reviewer",
      comment: locale === "zh" ? "已从 TestOps 评审门禁批准。" : "Approved from TestOps review gate.",
    });
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function createControlledRerunAction(formData: FormData) {
    "use server";

    const value = formData.get("proposalId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationDebugProposalRerun(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function createFinalReportAction(formData: FormData) {
    "use server";

    const value = formData.get("runId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await createAutomationFinalReport(value.trim());
    revalidatePath(`/projects/${projectId}/test-cases`);
  }

  async function pushFinalReportToLarkAction(formData: FormData) {
    "use server";

    const value = formData.get("finalReportId");
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    await pushAutomationFinalReportToLark(value.trim());
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
              const latestDebugProposal =
                latestAnalysis === undefined
                  ? undefined
                  : latestDebugProposalsByAnalysis.get(String(latestAnalysis.id));
              const latestReport =
                latestRun === undefined
                  ? undefined
                  : latestReportsByRun.get(String(latestRun.id));
              const latestFinalReport =
                latestRun === undefined
                  ? undefined
                  : latestFinalReportsByRun.get(String(latestRun.id));
              const reportDuration =
                latestReport === undefined
                  ? null
                  : getSummaryNumber(latestReport.summary, "duration_ms");
              const caseDataSetupHints = dataSetupHintsByCase.get(String(item.id)) ?? [];

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
                          {locale === "zh"
                            ? formatValue(latestGeneration.status, locale)
                            : latestGeneration.status}{" "}
                          -{" "}
                          {artifactText.generated}{" "}
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
                              <strong>{artifactText.latestRun}</strong>:{" "}
                              {locale === "zh"
                                ? formatValue(latestRun.status, locale)
                                : latestRun.status}{" "}
                              -{" "}
                              {artifactText.trigger}{" "}
                              {formatValue(latestRun.triggerMode, locale)}
                            </p>
                            {latestRun.reportPath ? (
                              <p>
                                {artifactText.report}: {latestRun.reportPath}
                              </p>
                            ) : null}
                            {latestReport ? (
                              <>
                                <p>
                                  <strong>{artifactText.allureReport}</strong>:{" "}
                                  {latestReport.indexPath}
                                </p>
                                {reportDuration ? (
                                  <p>
                                    {artifactText.duration} {reportDuration}ms
                                  </p>
                                ) : null}
                              </>
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
                                  {locale === "zh"
                                    ? formatValue(latestAnalysis.classification, locale)
                                    : latestAnalysis.classification}{" "}
                                  /{" "}
                                  {formatValue(latestAnalysis.provider, locale)}
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
                                {latestDebugProposal ? (
                                  <>
                                    <p>
                                      <strong>{artifactText.debugProposal}</strong>:{" "}
                                      {formatValue(latestDebugProposal.status, locale)}
                                    </p>
                                    <p>{latestDebugProposal.summary}</p>
                                    {latestDebugProposal.recommendations.length ? (
                                      <p>{latestDebugProposal.recommendations[0]}</p>
                                    ) : null}
                                  </>
                                ) : null}
                              </>
                            ) : null}
                            {latestFinalReport ? (
                              <>
                                <p>
                                  <strong>{artifactText.finalReport}</strong>:{" "}
                                  {formatValue(latestFinalReport.status, locale)}
                                </p>
                                <p>{latestFinalReport.title}</p>
                                <p>
                                  {artifactText.larkStatus}:{" "}
                                  {locale === "zh"
                                    ? formatValue(latestFinalReport.larkStatus, locale)
                                    : latestFinalReport.larkStatus}
                                </p>
                                {latestFinalReport.larkError ? (
                                  <p>{latestFinalReport.larkError}</p>
                                ) : null}
                              </>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    {caseDataSetupHints.length ? (
                      <div className="table-detail">
                        <strong>{artifactText.dataSetup}</strong>
                        {caseDataSetupHints.map((hint) => {
                          const latestExecution = latestDataSetupExecutionsByHint.get(
                            String(hint.id),
                          );
                          const statusCode =
                            latestExecution === undefined
                              ? null
                              : getSummaryNumber(
                                  latestExecution.responseSummary,
                                  "status_code",
                                );

                          return (
                            <React.Fragment key={hint.id}>
                              <p>
                                {hint.method.toUpperCase()} {hint.endpoint} -{" "}
                                {hint.purpose}
                              </p>
                              {latestExecution ? (
                                <p>
                                  <strong>{artifactText.dataSetupExecution}</strong>:{" "}
                                  {formatValue(latestExecution.status, locale)}
                                  {statusCode
                                    ? ` - ${artifactText.httpStatus} ${statusCode}`
                                    : null}
                                </p>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
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
                  {latestAnalysis?.shouldRerun && !latestDebugProposal ? (
                    <form action={createDebugProposalAction}>
                      <input
                        name="analysisId"
                        type="hidden"
                        value={String(latestAnalysis.id)}
                      />
                      <button className="secondary-button" type="submit">
                        {artifactText.createDebugProposal}
                      </button>
                    </form>
                  ) : null}
                  {latestDebugProposal?.status === "draft" ? (
                    <form action={approveDebugProposalAction}>
                      <input
                        name="proposalId"
                        type="hidden"
                        value={String(latestDebugProposal.id)}
                      />
                      <button className="secondary-button" type="submit">
                        {artifactText.approveProposal}
                      </button>
                    </form>
                  ) : null}
                  {latestDebugProposal?.status === "approved" ? (
                    <form action={createControlledRerunAction}>
                      <input
                        name="proposalId"
                        type="hidden"
                        value={String(latestDebugProposal.id)}
                      />
                      <button className="secondary-button" type="submit">
                        {artifactText.controlledRerun}
                      </button>
                    </form>
                  ) : null}
                  {latestRun && !latestFinalReport ? (
                    <form action={createFinalReportAction}>
                      <input name="runId" type="hidden" value={String(latestRun.id)} />
                      <button className="secondary-button" type="submit">
                        {artifactText.generateFinalReport}
                      </button>
                    </form>
                  ) : null}
                  {latestFinalReport && latestFinalReport.larkStatus !== "sent" ? (
                    <form action={pushFinalReportToLarkAction}>
                      <input
                        name="finalReportId"
                        type="hidden"
                        value={String(latestFinalReport.id)}
                      />
                      <button className="secondary-button" type="submit">
                        {artifactText.pushToLark}
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
