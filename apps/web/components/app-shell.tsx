import Link from "next/link";
import type { ReactNode } from "react";

import { copy, localizedHref, type Locale } from "../lib/i18n";
import { translateProjectName } from "../lib/project-display";
import type { ProjectRecord } from "../lib/types";

type AppShellProps = Readonly<{
  children: ReactNode;
  currentPath?: string;
  locale?: Locale;
  project?: ProjectRecord | null;
  testCaseCount?: number;
  contentWidth?: "default" | "wide";
}>;

type NavItem = {
  href: string;
  label: string;
  badge?: number;
};

function isCurrentPath(currentPath: string | undefined, href: string) {
  if (!currentPath) {
    return false;
  }

  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AppShell({
  children,
  currentPath,
  locale = "zh",
  project,
  testCaseCount = 0,
  contentWidth = "default",
}: AppShellProps) {
  const t = copy[locale].appShell;
  const isWide = contentWidth === "wide" || Boolean(project);
  const panelClassName = isWide ? "shell-panel shell-panel--wide" : "shell-panel";
  const projectDisplayName = project ? translateProjectName(project.name, locale) : null;
  const globalNav: NavItem[] = [
    { href: "/", label: t.projects },
    { href: "/settings", label: t.settings },
  ];
  const projectNav: NavItem[] = project
    ? [
        { href: `/projects/${project.id}`, label: t.overview },
        { href: `/projects/${project.id}/documents`, label: t.documents },
        { href: `/projects/${project.id}/generation-tasks`, label: t.generationTasks },
        {
          href: `/projects/${project.id}/automation-schedules`,
          label: t.automationSchedules,
        },
        {
          href: `/projects/${project.id}/test-cases`,
          label: t.testCases,
          badge: testCaseCount,
        },
        { href: `/projects/${project.id}/review`, label: t.review },
      ]
    : [];

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <span className="shell-kicker">TestOps</span>
          <h1 className="shell-title">{t.title}</h1>
          <p className="shell-copy">{t.intro}</p>
        </div>

        <nav className="shell-nav-group" aria-label={t.global}>
          <span className="shell-nav-label">{t.navigate}</span>
          {globalNav.map((item) => (
            <Link
              key={item.label}
              className="shell-nav-link"
              href={localizedHref(item.href, locale)}
              aria-current={isCurrentPath(currentPath, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {project ? (
          <nav className="shell-nav-group" aria-label={t.projectWorkspace}>
            <span className="shell-nav-label shell-project-name" title={projectDisplayName ?? undefined}>
              {projectDisplayName}
            </span>
            {projectNav.map((item) => (
              <Link
                key={item.href}
                className="shell-nav-link"
                href={localizedHref(item.href, locale)}
                aria-current={isCurrentPath(currentPath, item.href) ? "page" : undefined}
              >
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="nav-badge">{item.badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        ) : null}
      </aside>

      <main className="shell-main">
        <div className={panelClassName}>{children}</div>
      </main>
    </div>
  );
}
