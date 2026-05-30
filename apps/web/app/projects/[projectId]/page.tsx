import React from "react";
import { AppShell } from "../../../components/app-shell";
import { ProjectSummary } from "../../../components/project-summary";
import { getProject, listProjectDocuments, listProjectEnvironments } from "../../../lib/api";
import {
  copy,
  formatValue,
  localizedHref,
  normalizeLocale,
  type LocaleSearchParams,
} from "../../../lib/i18n";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.states.projectWorkspace}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.states.projectWorkspace}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.states.projectWorkspace}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const documentList = await listProjectDocuments(projectId);
  const environmentList = await listProjectEnvironments(projectId);
  const documents = documentList.kind === "http-error" ? [] : documentList.documents;
  const environments =
    environmentList.kind === "http-error" ? [] : environmentList.environments;

  return (
    <AppShell currentPath={`/projects/${projectId}`} locale={locale} project={project}>
      <section className="page-header">
        <span className="eyebrow">{t.workspace.eyebrow}</span>
        <h2>{project.name}</h2>
        <p>{project.description ?? t.workspace.fallbackDescription}</p>
      </section>

      <ProjectSummary
        project={project}
        documents={documents}
        documentsUnavailable={documentList.kind === "http-error"}
        locale={locale}
      />

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.workspace.environments}</span>
            <h3>{t.workspace.environments}</h3>
          </div>
          <p>{t.workspace.environmentCopy}</p>
        </div>
        {environmentList.kind === "http-error" ? (
          <p>{t.states.unavailable}</p>
        ) : environments.length ? (
          <div className="automation-list">
            {environments.map((environment) => (
              <article className="automation-card" key={environment.id}>
                <div>
                  <strong>{environment.name}</strong>
                  <p>
                    {environment.code} - {formatValue(environment.status, locale)}
                  </p>
                  <p>{environment.baseUrl}</p>
                  <p>{environment.apiBaseUrl}</p>
                  {environment.authProfile ? (
                    <p>
                      {locale === "zh" ? "认证配置" : "Auth profile"}:{" "}
                      {environment.authProfile}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">{t.workspace.noEnvironments}</p>
        )}
      </section>

      {documentList.kind === "http-error" ? (
        <section>
          <p>{t.workspace.documentsError}</p>
        </section>
      ) : null}

      <section className="workspace-links" aria-label={t.workspace.sections}>
        <a className="workspace-link" href={localizedHref(`/projects/${projectId}/documents`, locale)}>
          <span className="eyebrow">{t.workspace.documentCenter}</span>
          <h3>{t.workspace.documentsTitle}</h3>
          <p>{t.workspace.documentsCopy}</p>
        </a>

        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/generation-tasks`, locale)}
        >
          <span className="eyebrow">{t.workspace.generationQueue}</span>
          <h3>{t.workspace.generationTasks}</h3>
          <p>{t.workspace.generationCopy}</p>
        </a>

        <a className="workspace-link" href={localizedHref(`/projects/${projectId}/review`, locale)}>
          <span className="eyebrow">{t.workspace.reviewQueue}</span>
          <h3>{t.workspace.reviewWorkspace}</h3>
          <p>{t.workspace.reviewCopy}</p>
        </a>
      </section>
    </AppShell>
  );
}
