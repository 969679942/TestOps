import React from "react";
import { AppShell } from "../../../../components/app-shell";
import { DocumentTable } from "../../../../components/document-table";
import { getProject, listProjectDocuments } from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.workspace}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const documentList = await listProjectDocuments(projectId);
  const documents = documentList.kind === "http-error" ? [] : documentList.documents;

  return (
    <AppShell
      currentPath={`/projects/${projectId}/documents`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{t.documentsPage.eyebrow}</span>
        <h2>{project.name}</h2>
        <p>{t.documentsPage.description}</p>
      </section>

      <section className="summary-grid" aria-label={t.documentsPage.summary}>
        <article className="summary-card">
          <span className="eyebrow">{t.documentsPage.documents}</span>
          <p className="summary-value">
            {documentList.kind === "http-error" ? t.states.unavailable : documents.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.documentsPage.projectProvider}</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.documentsPage.promptProfile}</span>
          <p className="summary-value">{project.defaultPromptProfile}</p>
        </article>
      </section>

      {documentList.kind === "unavailable" ? (
        <section>
          <p>{t.documentsPage.fallback}</p>
        </section>
      ) : null}

      {documentList.kind === "http-error" ? (
        <section>
          <p>{t.documentsPage.error}</p>
        </section>
      ) : null}

      <DocumentTable items={documents} locale={locale} />

      <section className="workspace-links" aria-label={t.documentsPage.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/generation-tasks`, locale)}
        >
          <span className="eyebrow">{t.documentsPage.nextStep}</span>
          <h3>{t.documentsPage.generationTasks}</h3>
          <p>{t.documentsPage.nextCopy}</p>
        </a>
        <article className="workspace-link">
          <span className="eyebrow">{t.documentsPage.traceability}</span>
          <h3>{t.documentsPage.sourceVisibility}</h3>
          <p>{t.documentsPage.sourceCopy}</p>
        </article>
      </section>
    </AppShell>
  );
}
