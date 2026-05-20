import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { TestCaseTable } from "../../../../components/test-case-table";
import { getProject, listProjectTestCases } from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import type { TestCaseRecord } from "../../../../lib/types";

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
  const items = testCaseList.kind === "http-error" ? [] : testCaseList.items;
  const counts = getCounts(items);
  const countsUnavailable = testCaseList.kind === "http-error";

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
