"use client";

import Link from "next/link";
import { useState } from "react";

import { localizedHref, type Locale } from "../lib/i18n";
import { translateProjectDescription, translateProjectName } from "../lib/project-display";
import type { ProjectSummaryRecord } from "../lib/workspace-api";
import { copy } from "../lib/copy";
import { CreateProjectModal } from "./create-project-modal";

export type ProjectWithStats = ProjectSummaryRecord;

type ProjectDirectoryProps = Readonly<{
  projects: ProjectWithStats[];
  locale?: Locale;
}>;

export function ProjectDirectory({ projects, locale = "zh" }: ProjectDirectoryProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-toolbar project-directory-toolbar">
        <div className="project-directory-toolbar-copy">
          <span className="project-directory-toolbar-kicker">企业控制台视图</span>
          <p className="toolbar-meta">{copy.projectCount(projects.length)}</p>
        </div>
        <button className="button-primary" type="button" onClick={() => setModalOpen(true)}>
          + {copy.newProject}
        </button>
      </div>

      <section className="project-grid" aria-label={copy.projectListLabel}>
        {projects.length === 0 ? (
          <article className="empty-card wide">
            <h3>{copy.noProjects}</h3>
            <p>{copy.noProjectsHint}</p>
            <button className="button-primary" type="button" onClick={() => setModalOpen(true)}>
              + {copy.newProject}
            </button>
          </article>
        ) : (
          projects.map((project) => {
            const displayName = translateProjectName(project.name, locale);
            const displayDescription =
              translateProjectDescription(project.description, locale) ?? copy.noDescription;

            return (
              <Link
                key={project.id}
                className="card project-card"
                href={localizedHref(`/projects/${project.id}`, locale)}
              >
                <div className="project-card-header">
                  <div className="project-card-title-group">
                    <span className="project-card-kicker">项目概览</span>
                    <h2>{displayName}</h2>
                  </div>
                  <span className="project-code">{project.code}</span>
                </div>
                <div className="project-card-summary">
                  <p>{displayDescription}</p>
                </div>
                <div className="project-stats project-card-stats">
                  <span className="project-card-stat">
                    <strong>{project.documentCount}</strong> {copy.documents}
                  </span>
                  <span className="project-card-stat">
                    <strong>{project.testCaseCount}</strong> {copy.drafts}
                  </span>
                  <span className="project-card-stat">
                    <strong>{project.publishedCount}</strong> {copy.published}
                  </span>
                </div>
                <div className="project-card-footer">
                  <span className="project-card-indicator" aria-hidden="true" />
                  <span>进入项目工作区</span>
                </div>
              </Link>
            );
          })
        )}
      </section>

      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
