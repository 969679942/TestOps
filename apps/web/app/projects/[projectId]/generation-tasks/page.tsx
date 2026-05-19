import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { GenerationTaskList } from "../../../../components/generation-task-list";
import { getProject, listProjectGenerationTasks } from "../../../../lib/api";

type ProjectGenerationTasksPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectGenerationTasksPage({
  params,
}: ProjectGenerationTasksPageProps) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`}>
        <section className="page-header">
          <span className="eyebrow">Generation Queue</span>
          <h2>Project not found</h2>
          <p>The requested project is unavailable or no longer exists.</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`}>
        <section className="page-header">
          <span className="eyebrow">Generation Queue</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API returned an error.</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`}>
        <section className="page-header">
          <span className="eyebrow">Generation Queue</span>
          <h2>Project unavailable</h2>
          <p>The requested project could not be loaded because the API is unavailable.</p>
        </section>
      </AppShell>
    );
  }

  const taskList = await listProjectGenerationTasks(projectId);
  const tasks = taskList.kind === "http-error" ? [] : taskList.tasks;

  return (
    <AppShell currentPath={`/projects/${projectId}/generation-tasks`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Generation Queue</span>
        <h2>{project.name}</h2>
        <p>
          Track queued, completed, and failed generation runs alongside the document inputs that
          produced them.
        </p>
      </section>

      <section className="summary-grid" aria-label="Generation summary">
        <article className="summary-card">
          <span className="eyebrow">Tasks</span>
          <p className="summary-value">
            {taskList.kind === "http-error" ? "Unavailable" : tasks.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Default Provider</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Prompt Profile</span>
          <p className="summary-value">{project.defaultPromptProfile}</p>
        </article>
      </section>

      {taskList.kind === "unavailable" ? (
        <section>
          <p>Showing fallback generation history because the API is currently unavailable.</p>
        </section>
      ) : null}

      {taskList.kind === "http-error" ? (
        <section>
          <p>Generation tasks are temporarily unavailable because the API returned an error.</p>
        </section>
      ) : null}

      <GenerationTaskList items={tasks} />

      <section className="workspace-links" aria-label="Generation follow-up">
        <a className="workspace-link" href={`/projects/${projectId}/documents`}>
          <span className="eyebrow">Inputs</span>
          <h3>Document Center</h3>
          <p>Verify source coverage before retrying a failed run or queuing a new one.</p>
        </a>
        <article className="workspace-link">
          <span className="eyebrow">Later Task</span>
          <h3>Review Workspace</h3>
          <p>Draft case review remains intentionally staged for the follow-up UI task.</p>
        </article>
      </section>
    </AppShell>
  );
}
