import Link from "next/link";
import type { ReactNode } from "react";

import { copy, localizedHref, type Locale, withLocale } from "../lib/i18n";
import type { ProjectRecord } from "../lib/types";

type AppShellProps = Readonly<{
  children: ReactNode;
  currentPath?: string;
  locale?: Locale;
  project?: ProjectRecord | null;
  testCaseCount?: number;
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
  locale = "en",
  project,
  testCaseCount = 0,
}: AppShellProps) {
  const t = copy[locale].appShell;
  const switchLocale: Locale = locale === "zh" ? "en" : "zh";
  const languageHref = withLocale(currentPath ?? "/", switchLocale);
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

        <nav className="shell-nav-group" aria-label={t.language}>
          <span className="shell-nav-label">{t.language}</span>
          <a className="shell-language-link" href={languageHref}>
            {t.switchTo}
          </a>
        </nav>

        {project ? (
          <nav className="shell-nav-group" aria-label={t.projectWorkspace}>
            <span className="shell-nav-label">{project.name}</span>
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
        <div className="shell-panel">{children}</div>
      </main>
    </div>
  );
}
