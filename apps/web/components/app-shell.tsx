import React from "react";
import type { ReactNode } from "react";

import type { ProjectRecord } from "../lib/api";

type AppShellProps = Readonly<{
  children: ReactNode;
  currentPath?: string;
  project?: ProjectRecord | null;
}>;

type NavItem = {
  href?: string;
  label: string;
};

const globalNav: NavItem[] = [
  { href: "/", label: "Projects" },
  { label: "Settings" },
];

function isCurrentPath(currentPath: string | undefined, href: string) {
  if (!currentPath) {
    return false;
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AppShell({ children, currentPath, project }: AppShellProps) {
  const projectNav: NavItem[] = project
    ? [
        { href: `/projects/${project.id}`, label: "Overview" },
        { href: `/projects/${project.id}/documents`, label: "Documents" },
      ]
    : [];

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <span className="shell-kicker">TestOps</span>
          <h1 className="shell-title">Workspace</h1>
          <p className="shell-copy">
            Organize source evidence and keep each project moving toward reviewed
            test cases.
          </p>
        </div>

        <nav className="shell-nav-group" aria-label="Global">
          <span className="shell-nav-label">Navigate</span>
          {globalNav.map((item) =>
            item.href ? (
              <a
                key={item.label}
                className="shell-nav-link"
                href={item.href}
                aria-current={isCurrentPath(currentPath, item.href) ? "page" : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span key={item.label} className="shell-nav-disabled" aria-disabled="true">
                {item.label}
              </span>
            ),
          )}
        </nav>

        {project ? (
          <nav className="shell-nav-group" aria-label="Project workspace">
            <span className="shell-nav-label">{project.name}</span>
            {projectNav.map((item) => (
              <a
                key={item.href}
                className="shell-nav-link"
                href={item.href}
                aria-current={isCurrentPath(currentPath, item.href ?? "") ? "page" : undefined}
              >
                {item.label}
              </a>
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
