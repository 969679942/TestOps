import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { GenerationTaskList } from "../../../../components/generation-task-list";
import { getProject, listProjectGenerationTasks } from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";

type ProjectGenerationTasksPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function ProjectGenerationTasksPage({
  params,
  searchParams,
}: ProjectGenerationTasksPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.generationPage.eyebrow}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.generationPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.generationPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const taskList = await listProjectGenerationTasks(projectId);
  const tasks = taskList.kind === "http-error" ? [] : taskList.tasks;

  return (
    <AppShell
      currentPath={`/projects/${projectId}/generation-tasks`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{t.generationPage.eyebrow}</span>
        <h2>{project.name}</h2>
        <p>{t.generationPage.description}</p>
      </section>

      <section className="summary-grid" aria-label={t.generationPage.summary}>
        <article className="summary-card">
          <span className="eyebrow">{t.generationPage.tasks}</span>
          <p className="summary-value">
            {taskList.kind === "http-error" ? t.states.unavailable : tasks.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.generationPage.defaultProvider}</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.generationPage.promptProfile}</span>
          <p className="summary-value">{project.defaultPromptProfile}</p>
        </article>
      </section>

      {taskList.kind === "unavailable" ? (
        <section>
          <p>{t.generationPage.fallback}</p>
        </section>
      ) : null}

      {taskList.kind === "http-error" ? (
        <section>
          <p>{t.generationPage.error}</p>
        </section>
      ) : null}

      <GenerationTaskList items={tasks} locale={locale} />

      <section className="workspace-links" aria-label={t.generationPage.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/documents`, locale)}
        >
          <span className="eyebrow">{t.generationPage.inputs}</span>
          <h3>{t.generationPage.documentCenter}</h3>
          <p>{t.generationPage.inputsCopy}</p>
        </a>
        <article className="workspace-link">
          <span className="eyebrow">{t.generationPage.laterTask}</span>
          <h3>{t.generationPage.reviewWorkspace}</h3>
          <p>{t.generationPage.reviewCopy}</p>
        </article>
      </section>
    </AppShell>
  );
}
