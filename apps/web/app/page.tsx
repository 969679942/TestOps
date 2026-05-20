import React from "react";
import { AppShell } from "../components/app-shell";
import { listProjects } from "../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../lib/i18n";

type HomePageProps = Readonly<{
  searchParams?: Promise<LocaleSearchParams>;
}>;

export default async function HomePage({ searchParams }: HomePageProps = {}) {
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale].home;
  const projectList = await listProjects();

  return (
    <AppShell currentPath="/" locale={locale}>
      <section className="page-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2>{t.title}</h2>
        <p>{t.description}</p>
      </section>

      <section className="project-grid" aria-label={t.aria}>
        {projectList.kind === "http-error" ? (
          <article className="card">
            <h2>{t.unavailableTitle}</h2>
            <p>{t.unavailableCopy}</p>
          </article>
        ) : (
          projectList.projects.map((project) => (
            <a
              key={project.id}
              className="card"
              href={localizedHref(`/projects/${project.id}`, locale)}
            >
              <h2>{project.name}</h2>
              <p>{project.description ?? t.noDescription}</p>
              <div className="card-meta">
                <strong>{project.code}</strong> - {t.provider} {project.defaultProvider}
              </div>
            </a>
          ))
        )}
      </section>
    </AppShell>
  );
}
