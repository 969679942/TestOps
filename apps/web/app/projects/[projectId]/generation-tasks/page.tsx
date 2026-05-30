import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { GenerationTaskList } from "../../../../components/generation-task-list";
import {
  createGenerationTask,
  getProject,
  listProjectGenerationTasks,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import { translateProjectName } from "../../../../lib/project-display";

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

  const projectDisplayName = translateProjectName(project.name, locale);

  const taskList = await listProjectGenerationTasks(projectId);
  const tasks = taskList.kind === "http-error" ? [] : taskList.tasks;

  async function createGenerationAction(formData: FormData) {
    "use server";

    const read = (name: string) => {
      const value = formData.get(name);
      return typeof value === "string" ? value.trim() : "";
    };
    const inputDocumentIds = read("inputDocumentIds")
      .split(/[\s,]+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0);
    const provider = read("provider");
    const model = read("model");
    const promptProfile = read("promptProfile");

    await createGenerationTask(projectId, {
      input_document_ids: inputDocumentIds,
      provider: provider || null,
      model: model || null,
      prompt_profile: promptProfile || null,
    });
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  return (
    <AppShell
      currentPath={`/projects/${projectId}/generation-tasks`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{t.generationPage.eyebrow}</span>
        <h2>{projectDisplayName}</h2>
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

      <section className="data-card generation-create-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.generationPage.eyebrow}</span>
            <h3>{t.generationPage.createTitle}</h3>
          </div>
          <p>{t.generationPage.createCopy}</p>
        </div>
        <form action={createGenerationAction} className="review-stack generation-create-form">
          <div className="form-grid">
            <label className="form-field">
              <span>{t.generationPage.documentIds}</span>
              <input className="field-input" name="inputDocumentIds" placeholder="1, 2, 3" />
            </label>
            <label className="form-field">
              <span>{t.generationPage.provider}</span>
              <select className="field-input" name="provider" defaultValue="">
                <option value="">{t.generationPage.projectDefault}</option>
                <option value="cursor">Cursor</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label className="form-field">
              <span>{t.generationPage.model}</span>
              <input className="field-input" name="model" placeholder={project.defaultProvider} />
            </label>
            <label className="form-field">
              <span>{t.generationPage.promptProfile}</span>
              <input
                className="field-input"
                name="promptProfile"
                placeholder={project.defaultPromptProfile}
              />
            </label>
          </div>
          <button className="primary-button" type="submit">
            {t.generationPage.queueGeneration}
          </button>
        </form>
      </section>

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
