import React from "react";

import { AppShell } from "../../../../components/app-shell";
import {
  getProject,
  listProjectAutomationSchedules,
  listProjectEnvironments,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import type { AutomationScheduleRecord, EnvironmentRecord } from "../../../../lib/types";

type ProjectAutomationSchedulesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

function getEnvironmentName(
  environments: EnvironmentRecord[],
  schedule: AutomationScheduleRecord,
) {
  return (
    environments.find(
      (environment) => String(environment.id) === String(schedule.environmentId),
    )?.name ?? `Environment #${schedule.environmentId}`
  );
}

function formatDateTime(value: string | null) {
  return value ?? "Not run yet";
}

export default async function ProjectAutomationSchedulesPage({
  params,
  searchParams,
}: ProjectAutomationSchedulesPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);
  const pageText =
    locale === "zh"
      ? {
          eyebrow: "定时执行",
          title: "Automation Schedules",
          description:
            "维护按 cron 触发的自动化计划，worker 到点会创建 automation run 并交给 runner 执行。",
          schedules: "Schedules",
          environments: "Environments",
          unavailable:
            "Automation schedules are temporarily unavailable because the API returned an error.",
          fallback:
            "Showing an empty schedule view because the API is currently unavailable.",
          empty: "No automation schedules have been created yet.",
          status: "Status",
          cron: "Cron",
          environment: "Environment",
          targets: "Targets",
          nextRun: "Next run",
          lastRun: "Last run",
          target: "target",
          targetsPlural: "targets",
          followUp: "Schedule follow-up",
          testCases: "Test Cases",
          testCaseCopy:
            "Pick published cases and generated automation assets before building a schedule.",
        }
      : {
          eyebrow: "Scheduled execution",
          title: "Automation Schedules",
          description:
            "Maintain cron-triggered automation plans. The worker creates automation runs when schedules become due and dispatches the runner.",
          schedules: "Schedules",
          environments: "Environments",
          unavailable:
            "Automation schedules are temporarily unavailable because the API returned an error.",
          fallback:
            "Showing an empty schedule view because the API is currently unavailable.",
          empty: "No automation schedules have been created yet.",
          status: "Status",
          cron: "Cron",
          environment: "Environment",
          targets: "Targets",
          nextRun: "Next run",
          lastRun: "Last run",
          target: "target",
          targetsPlural: "targets",
          followUp: "Schedule follow-up",
          testCases: "Test Cases",
          testCaseCopy:
            "Pick published cases and generated automation assets before building a schedule.",
        };

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/automation-schedules`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{pageText.eyebrow}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/automation-schedules`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{pageText.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/automation-schedules`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{pageText.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const scheduleList = await listProjectAutomationSchedules(projectId);
  const environmentList = await listProjectEnvironments(projectId);
  const schedules = scheduleList.kind === "http-error" ? [] : scheduleList.items;
  const environments =
    environmentList.kind === "http-error" ? [] : environmentList.environments;

  return (
    <AppShell
      currentPath={`/projects/${projectId}/automation-schedules`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{pageText.eyebrow}</span>
        <h2>{pageText.title}</h2>
        <p>{pageText.description}</p>
      </section>

      <section className="summary-grid" aria-label="Automation schedule summary">
        <article className="summary-card">
          <span className="eyebrow">{pageText.schedules}</span>
          <p className="summary-value">
            {scheduleList.kind === "http-error" ? t.states.unavailable : schedules.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{pageText.environments}</span>
          <p className="summary-value">
            {environmentList.kind === "http-error" ? t.states.unavailable : environments.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.components.defaultProvider}</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
      </section>

      {scheduleList.kind === "unavailable" ? (
        <section>
          <p>{pageText.fallback}</p>
        </section>
      ) : null}

      {scheduleList.kind === "http-error" ? (
        <section>
          <p>{pageText.unavailable}</p>
        </section>
      ) : null}

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{pageText.eyebrow}</span>
            <h3>{pageText.title}</h3>
          </div>
          <p>{pageText.description}</p>
        </div>
        {schedules.length ? (
          <div className="automation-list">
            {schedules.map((schedule) => {
              const targetCount = schedule.targetGenerationIds.length;
              return (
                <article className="automation-card" key={schedule.id}>
                  <div>
                    <strong>{schedule.name}</strong>
                    <p>
                      {pageText.status}: {schedule.status}
                    </p>
                    <div className="table-detail">
                      <p>
                        <strong>{pageText.cron}</strong>: {schedule.cronExpression}
                      </p>
                      <p>
                        <strong>{pageText.environment}</strong>:{" "}
                        {getEnvironmentName(environments, schedule)}
                      </p>
                      <p>
                        <strong>{pageText.targets}</strong>: {targetCount}{" "}
                        {targetCount === 1 ? pageText.target : pageText.targetsPlural}
                      </p>
                      <p>
                        <strong>{pageText.nextRun}</strong>:{" "}
                        {formatDateTime(schedule.nextRunAt)}
                      </p>
                      <p>
                        <strong>{pageText.lastRun}</strong>:{" "}
                        {formatDateTime(schedule.lastRunAt)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-copy">{pageText.empty}</p>
        )}
      </section>

      <section className="workspace-links" aria-label={pageText.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/test-cases`, locale)}
        >
          <span className="eyebrow">{pageText.followUp}</span>
          <h3>{pageText.testCases}</h3>
          <p>{pageText.testCaseCopy}</p>
        </a>
      </section>
    </AppShell>
  );
}
