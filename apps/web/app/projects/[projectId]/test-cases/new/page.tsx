import React from "react";
import Link from "next/link";

import { AppShell } from "../../../../../components/app-shell";
import { Breadcrumbs } from "../../../../../components/breadcrumbs";
import { ProjectArchiveBanner } from "../../../../../components/project-archive-banner";
import { copy } from "../../../../../lib/copy";
import {
  localizedHref,
  normalizeLocale,
  type LocaleSearchParams,
} from "../../../../../lib/i18n";
import { translateProjectName } from "../../../../../lib/project-display";
import { getProject } from "../../../../../lib/workspace-api";
import { loadOrThrow } from "../../../../../lib/server-load";
import { NewTestCasePageClient } from "./page-client";

type NewTestCasePageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function NewTestCasePage({
  params,
  searchParams,
}: NewTestCasePageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const project = await loadOrThrow(() => getProject(projectId));
  const projectDisplayName = translateProjectName(project.name, locale);
  const archived = project.status === "archived";

  return (
    <AppShell currentPath={`/projects/${projectId}/test-cases`} locale={locale} project={project}>
      <Breadcrumbs
        items={[
          { label: copy.projects, href: localizedHref("/", locale) },
          {
            label: projectDisplayName,
            href: localizedHref(`/projects/${projectId}`, locale),
          },
          {
            label: copy.testCases,
            href: localizedHref(`/projects/${projectId}/test-cases`, locale),
          },
          { label: copy.composeTitle },
        ]}
      />

      <section className="page-header compact">
        <span className="eyebrow">{copy.uiAutomationEyebrow}</span>
        <h2>{copy.composeTitle}</h2>
        <p>{copy.composeHint}</p>
      </section>

      <div className="page-toolbar">
        <p className="toolbar-meta">{copy.composeToolbarHint}</p>
        <Link
          className="button-secondary"
          href={localizedHref(`/projects/${projectId}/test-cases`, locale)}
        >
          {copy.backToList}
        </Link>
      </div>

      {archived ? (
        <>
          <ProjectArchiveBanner />
          <section className="data-card">
            <p className="archived-action-lock">{copy.archivedProjectActionHint}</p>
          </section>
        </>
      ) : (
        <NewTestCasePageClient projectId={projectId} />
      )}
    </AppShell>
  );
}
