import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { PageDescription } from "../../../../components/page-description";
import { ProjectArchiveBanner } from "../../../../components/project-archive-banner";
import { copy as uiCopy } from "../../../../lib/copy";
import {
  getProject,
  listProjectAutomationSchedules,
  listProjectEnvironments,
} from "../../../../lib/api";
import {
  copy,
  formatDateTime,
  formatValue,
  localizedHref,
  normalizeLocale,
  type Locale,
  type LocaleSearchParams,
} from "../../../../lib/i18n";
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
  locale: Locale,
) {
  return (
    environments.find(
      (environment) => String(environment.id) === String(schedule.environmentId),
    )?.name ?? `${copy[locale].schedulesPage.environmentFallback} #${schedule.environmentId}`
  );
}

export default async function ProjectAutomationSchedulesPage({
  params,
  searchParams,
}: ProjectAutomationSchedulesPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const pageText = t.schedulesPage;
  const projectResult = await getProject(projectId);

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
  const archived = project.status === "archived";

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
        <PageDescription page="automationSchedules" />
      </section>

      <section className="summary-grid" aria-label={pageText.summary}>
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

      {archived ? <ProjectArchiveBanner /> : null}

      <section className="data-card automation-schedules-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{pageText.eyebrow}</span>
            <h3>{pageText.title}</h3>
          </div>
          <p>{pageText.description}</p>
        </div>
        {archived ? (
          <div className="archived-action-lock">{uiCopy.archivedProjectActionHint}</div>
        ) : null}
        {schedules.length ? (
          <div className="automation-list">
            {schedules.map((schedule) => {
              const targetCount = schedule.targetGenerationIds.length;
              return (
                <article className="automation-card" key={schedule.id}>
                  <div>
                    <strong>{schedule.name}</strong>
                    <p>
                      {pageText.status}: {formatValue(schedule.status, locale)}
                    </p>
                    <div className="table-detail">
                      <p>
                        <strong>{pageText.cron}</strong>: {schedule.cronExpression}
                      </p>
                      <p>
                        <strong>{pageText.environment}</strong>:{" "}
                        {getEnvironmentName(environments, schedule, locale)}
                      </p>
                      <p>
                        <strong>{pageText.targets}</strong>: {targetCount}{" "}
                        {targetCount === 1 ? pageText.target : pageText.targetsPlural}
                      </p>
                      <p>
                        <strong>{pageText.nextRun}</strong>:{" "}
                        {formatDateTime(schedule.nextRunAt, locale)}
                      </p>
                      <p>
                        <strong>{pageText.lastRun}</strong>:{" "}
                        {formatDateTime(schedule.lastRunAt, locale)}
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
