"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { copy } from "../lib/copy";
import { localizedHref, type Locale } from "../lib/i18n";
import {
  moveProjectBetweenLists,
  prependProject,
  toProjectSummaryRecord,
} from "../lib/project-directory-state";
import { translateProjectDescription, translateProjectName } from "../lib/project-display";
import type { ProjectRecord, ProjectSummaryRecord } from "../lib/workspace-api";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectStatusAction } from "./project-status-action";

export type ProjectWithStats = ProjectSummaryRecord;

type ProjectDirectoryProps = Readonly<{
  projects: ProjectWithStats[];
  archivedProjects?: ProjectWithStats[];
  locale?: Locale;
}>;

export function ProjectDirectory({
  projects,
  archivedProjects = [],
  locale = "zh",
}: ProjectDirectoryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"active" | "archived">("active");
  const [activeItems, setActiveItems] = useState(projects);
  const [archivedItems, setArchivedItems] = useState(archivedProjects);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setActiveItems(projects);
  }, [projects]);

  useEffect(() => {
    setArchivedItems(archivedProjects);
  }, [archivedProjects]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleProjects = useMemo(
    () => (view === "active" ? activeItems : archivedItems),
    [activeItems, archivedItems, view],
  );

  function handleStatusUpdated(projectId: string, nextStatus: "active" | "archived") {
    const movedState = moveProjectBetweenLists(
      activeItems,
      archivedItems,
      projectId,
      nextStatus,
    );
    setActiveItems(movedState.activeItems);
    setArchivedItems(movedState.archivedItems);
    setToast({
      type: "success",
      text: nextStatus === "archived" ? copy.projectArchivedToast : copy.projectRestoredToast,
    });
  }

  function handleProjectCreated(project: ProjectRecord) {
    const summary = toProjectSummaryRecord(project);
    if (summary.status === "archived") {
      setArchivedItems((items) => prependProject(items, summary));
      setView("archived");
    } else {
      setActiveItems((items) => prependProject(items, summary));
      setView("active");
    }
    setToast({ type: "success", text: copy.projectCreated });
  }

  return (
    <>
      <div className="page-toolbar project-directory-toolbar">
        <div className="project-directory-toolbar-copy">
          <span className="project-directory-toolbar-kicker">企业控制台视图</span>
          <p className="toolbar-meta">{copy.projectCount(visibleProjects.length)}</p>
          <div className="project-filter-tabs" role="tablist" aria-label={copy.projectListLabel}>
            <button
              className={`filter-tab ${view === "active" ? "is-active" : ""}`}
              type="button"
              aria-pressed={view === "active"}
              onClick={() => setView("active")}
            >
              {copy.activeProjects}
            </button>
            <button
              className={`filter-tab ${view === "archived" ? "is-active" : ""}`}
              type="button"
              aria-pressed={view === "archived"}
              onClick={() => setView("archived")}
            >
              {copy.archivedProjects}
            </button>
          </div>
        </div>
        <button className="button-primary" type="button" onClick={() => setModalOpen(true)}>
          + {copy.newProject}
        </button>
      </div>

      {toast ? <div className={`toast toast-${toast.type}`} role="status">{toast.text}</div> : null}

      <section className="project-grid" aria-label={copy.projectListLabel}>
        {visibleProjects.length === 0 ? (
          <article className="empty-card wide">
            <h3>{view === "active" ? copy.noProjects : copy.archivedProjects}</h3>
            <p>
              {view === "active"
                ? copy.noProjectsHint
                : copy.projectArchivedHint}
            </p>
            {view === "active" ? (
              <button
                className="button-primary"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                + {copy.newProject}
              </button>
            ) : null}
          </article>
        ) : (
          visibleProjects.map((project) => {
            const displayName = translateProjectName(project.name, locale);
            const displayDescription =
              translateProjectDescription(project.description, locale) ?? copy.noDescription;

            return (
              <article key={project.id} className="card project-card">
                <div className="project-card-header">
                  <div className="project-card-title-group">
                    <span className="project-card-kicker">项目概览</span>
                    <h2 className="project-card-title" title={displayName}>
                      {displayName}
                    </h2>
                  </div>
                  <div className="project-card-meta-row">
                    <ProjectStatusAction
                      projectId={project.id}
                      status={project.status as "active" | "archived"}
                      className="button-secondary project-card-status-action"
                      onUpdated={(status) => handleStatusUpdated(project.id, status)}
                    />
                  </div>
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
                  <Link
                    className="project-card-link"
                    href={localizedHref(`/projects/${project.id}`, locale)}
                  >
                    进入项目工作区
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </>
  );
}
