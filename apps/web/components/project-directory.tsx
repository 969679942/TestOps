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
import { matchesSearchQuery } from "../lib/search";
import {
  createDefaultWorkspacePreferences,
  parseWorkspacePreferences,
  removeProjectFromPreferences,
  toggleFavoriteProject,
  trackRecentProject,
  type WorkspacePreferences,
} from "../lib/project-workspace-preferences";
import { translateProjectDescription, translateProjectName } from "../lib/project-display";
import type { ProjectRecord, ProjectSummaryRecord } from "../lib/workspace-api";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectDeleteAction } from "./project-delete-action";
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
  const [view, setView] = useState<"active" | "archived">(
    projects.length === 0 && archivedProjects.length > 0 ? "archived" : "active",
  );
  const [activeItems, setActiveItems] = useState(projects);
  const [archivedItems, setArchivedItems] = useState(archivedProjects);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [preferences, setPreferences] = useState<WorkspacePreferences>(
    createDefaultWorkspacePreferences,
  );

  useEffect(() => {
    setActiveItems(projects);
  }, [projects]);

  useEffect(() => {
    setArchivedItems(archivedProjects);
  }, [archivedProjects]);

  useEffect(() => {
    setPreferences(parseWorkspacePreferences(window.localStorage.getItem("testops.workspace")));
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    window.localStorage.setItem("testops.workspace", JSON.stringify(preferences));
  }, [preferences, preferencesLoaded]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const visibleProjects = useMemo(
    () => (view === "active" ? activeItems : archivedItems),
    [activeItems, archivedItems, view],
  );
  const filteredProjects = useMemo(() => {
    if (!query.trim()) {
      return visibleProjects;
    }

    return visibleProjects.filter((project) => {
      const displayName = translateProjectName(project.name, locale);
      const displayDescription = translateProjectDescription(project.description, locale) ?? "";
      return matchesSearchQuery(
        [displayName, project.name, project.code, displayDescription],
        query,
      );
    });
  }, [locale, query, visibleProjects]);
  const recentProjects = useMemo(
    () =>
      preferences.recentProjectIds
        .map((projectId) => activeItems.find((project) => project.id === projectId))
        .filter((project): project is ProjectWithStats => Boolean(project))
        .slice(0, 3),
    [activeItems, preferences.recentProjectIds],
  );
  const favoriteProjects = useMemo(
    () =>
      preferences.favoriteProjectIds
        .map((projectId) => activeItems.find((project) => project.id === projectId))
        .filter((project): project is ProjectWithStats => Boolean(project))
        .slice(0, 3),
    [activeItems, preferences.favoriteProjectIds],
  );
  const commandItems = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase();
    const actions = [
      { label: "打开工作台", path: "" },
      { label: "上传文档", path: "/documents" },
      { label: "配置 Skills", path: "/skills" },
      { label: "生成用例", path: "/generation-tasks" },
      { label: "评审用例", path: "/review" },
    ];

    return activeItems
      .flatMap((project) => {
        const displayName = translateProjectName(project.name, locale);
        return actions.map((action) => ({
          id: `${project.id}:${action.path}`,
          projectId: project.id,
          label: `${action.label} · ${displayName}`,
          href: localizedHref(`/projects/${project.id}${action.path}`, locale),
          searchValues: [action.label, displayName, project.name, project.code],
        }));
      })
      .filter((item) => matchesSearchQuery(item.searchValues, normalizedQuery))
      .slice(0, 8);
  }, [activeItems, commandQuery, locale]);

  function handleStatusUpdated(projectId: string, nextStatus: "active" | "archived") {
    const movedState = moveProjectBetweenLists(
      activeItems,
      archivedItems,
      projectId,
      nextStatus,
    );
    setActiveItems(movedState.activeItems);
    setArchivedItems(movedState.archivedItems);
    if (nextStatus === "archived") {
      setPreferences((current) => removeProjectFromPreferences(current, projectId));
    }
    setToast({
      type: "success",
      text: nextStatus === "archived" ? copy.projectArchivedToast : copy.projectRestoredToast,
    });
  }

  function handleProjectDeleted(projectId: string) {
    setArchivedItems((items) => items.filter((project) => project.id !== projectId));
    setPreferences((current) => removeProjectFromPreferences(current, projectId));
    setToast({ type: "success", text: copy.projectDeletedToast });
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

  function handleProjectOpened(projectId: string) {
    setPreferences((current) => trackRecentProject(current, projectId));
  }

  function handleFavoriteToggle(projectId: string) {
    setPreferences((current) => toggleFavoriteProject(current, projectId));
  }

  function renderProjectShortcut(project: ProjectWithStats) {
    const displayName = translateProjectName(project.name, locale);
    return (
      <Link
        key={project.id}
        className="project-shortcut"
        href={localizedHref(`/projects/${project.id}`, locale)}
        onClick={() => handleProjectOpened(project.id)}
      >
        <span className="project-shortcut-dot" aria-hidden="true" />
        <span className="project-shortcut-name">{displayName}</span>
      </Link>
    );
  }

  return (
    <>
      <section className="project-launchpad" aria-label="项目启动台">
        <div className="project-directory-toolbar-copy">
          <span className="project-directory-toolbar-kicker">项目启动台</span>
          <p className="toolbar-meta">
            直接进入工作台，或从文档、Skills、生成任务继续主链路。
          </p>
        </div>
        <div className="project-quick-jump">
          <label className="field project-search-field">
            <span>搜索项目或模块</span>
            <input
              type="search"
              value={query}
              placeholder="输入项目名称、代号或描述"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button
            className="project-command-trigger"
            type="button"
            onClick={() => setCommandOpen(true)}
          >
            <span>快捷跳转</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="project-shortcut-group" aria-label="快捷项目">
            <div>
              <span className="project-shortcut-label">最近</span>
              <div className="project-shortcut-list">
                {recentProjects.length > 0 ? (
                  recentProjects.map(renderProjectShortcut)
                ) : (
                  <span className="project-shortcut-empty">打开项目后会出现在这里</span>
                )}
              </div>
            </div>
            <div>
              <span className="project-shortcut-label">收藏</span>
              <div className="project-shortcut-list">
                {favoriteProjects.length > 0 ? (
                  favoriteProjects.map(renderProjectShortcut)
                ) : (
                  <span className="project-shortcut-empty">收藏高频项目，减少查找</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-toolbar project-directory-toolbar">
        <div className="project-directory-toolbar-copy">
          <span className="project-directory-toolbar-kicker">项目列表</span>
          <p className="toolbar-meta">{copy.projectCount(filteredProjects.length)}</p>
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

      {toast ? <div className={`toast toast-${toast.type}`} aria-live="polite">{toast.text}</div> : null}

      <section className="project-grid" aria-label={copy.projectListLabel}>
        {filteredProjects.length === 0 ? (
          <article className="empty-card wide">
            <h3>
              {query.trim()
                ? copy.noMatchingCases
                : view === "active"
                  ? copy.noProjects
                  : copy.archivedProjects}
            </h3>
            <p>
              {query.trim()
                ? "没有匹配的项目，试试更短的关键词。"
                : view === "active"
                  ? copy.noProjectsHint
                  : copy.projectArchivedHint}
            </p>
            {view === "active" && !query.trim() ? (
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
          filteredProjects.map((project) => {
            const displayName = translateProjectName(project.name, locale);
            const displayDescription =
              translateProjectDescription(project.description, locale) ?? copy.noDescription;
            const workspaceHref = localizedHref(`/projects/${project.id}`, locale);
            const isFavorite = preferences.favoriteProjectIds.includes(project.id);
            const isArchived = project.status === "archived";

            return (
              <article key={project.id} className="card project-card">
                <div className="project-card-header">
                  <div className="project-card-title-group">
                    <span className="project-card-kicker">项目工作台</span>
                    <h2 className="project-card-title" title={displayName}>
                      {displayName}
                    </h2>
                  </div>
                  <div className="project-card-meta-row">
                    {isArchived ? (
                      <ProjectDeleteAction
                        projectId={project.id}
                        className="button-secondary project-card-status-action is-danger"
                        onDeleted={() => handleProjectDeleted(project.id)}
                      />
                    ) : (
                      <button
                        className={`button-secondary project-card-status-action ${
                          isFavorite ? "is-favorite" : ""
                        }`}
                        type="button"
                        aria-pressed={isFavorite}
                        onClick={() => handleFavoriteToggle(project.id)}
                      >
                        {isFavorite ? "已收藏" : "收藏"}
                      </button>
                    )}
                    <ProjectStatusAction
                      projectId={project.id}
                      status={project.status as "active" | "archived"}
                      className="button-secondary project-card-status-action"
                      onUpdated={(status) => handleStatusUpdated(project.id, status)}
                    />
                  </div>
                </div>
                <div className="project-card-primary">
                  <Link
                    className="button-primary"
                    href={workspaceHref}
                    onClick={() => handleProjectOpened(project.id)}
                  >
                    打开工作台
                  </Link>
                  <span className="project-card-primary-copy">
                    {isArchived
                      ? copy.archivedProjectReadonlyHint
                      : "进入后直接处理上传、生成、评审主链路。"}
                  </span>
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
                {isArchived ? null : (
                  <div className="project-card-quick-actions" aria-label={`${displayName} 快捷入口`}>
                    <Link
                      className="project-card-link"
                      href={localizedHref(`/projects/${project.id}/documents`, locale)}
                      onClick={() => handleProjectOpened(project.id)}
                    >
                      上传文档
                    </Link>
                    <Link
                      className="project-card-link"
                      href={localizedHref(`/projects/${project.id}/skills`, locale)}
                      onClick={() => handleProjectOpened(project.id)}
                    >
                      配置 Skills
                    </Link>
                    <Link
                      className="project-card-link"
                      href={localizedHref(`/projects/${project.id}/generation-tasks`, locale)}
                      onClick={() => handleProjectOpened(project.id)}
                    >
                      生成用例
                    </Link>
                  </div>
                )}
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

      {commandOpen ? (
        <div className="command-palette-backdrop">
          <dialog
            open
            className="command-palette"
            aria-label="快捷跳转"
          >
            <div className="command-palette-header">
              <span className="project-directory-toolbar-kicker">快捷跳转</span>
              <button className="button-secondary" type="button" onClick={() => setCommandOpen(false)}>
                关闭
              </button>
            </div>
            <label className="field">
              <span>搜索项目、文档、Skills 或生成任务</span>
              <input
                type="search"
                value={commandQuery}
                placeholder="例如：支付平台 生成用例"
                onChange={(event) => setCommandQuery(event.target.value)}
              />
            </label>
            <div className="command-result-list">
              {commandItems.length > 0 ? (
                commandItems.map((item) => (
                  <Link
                    key={item.id}
                    className="command-result-item"
                    href={item.href}
                    onClick={() => handleProjectOpened(item.projectId)}
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <p className="empty-copy">没有匹配的快捷入口。</p>
              )}
            </div>
          </dialog>
        </div>
      ) : null}
    </>
  );
}
