import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { ReviewEditor } from "../../../../components/review-editor";
import { getProject, listProjectTestCases } from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale } from "../../../../lib/i18n";

type ProjectReviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<{
    caseId?: string;
    lang?: string | string[];
  }>;
};

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

      {canRenderEditor ? <ReviewEditor item={selectedItem} locale={locale} /> : null}

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
