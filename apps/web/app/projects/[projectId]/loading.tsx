import { AppShell } from "../../../components/app-shell";
import { copy } from "../../../lib/copy";

export default function ProjectWorkspaceLoadingPage() {
  return (
    <AppShell currentPath="/projects/loading" contentWidth="wide">
      <section className="page-header">
        <span className="eyebrow">{copy.workspaceEyebrow}</span>
        <div className="skeleton-line skeleton-line--title" aria-hidden="true" />
        <div className="skeleton-line skeleton-line--body" aria-hidden="true" />
      </section>

      <section className="data-card workspace-loading-card" aria-live="polite" aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <p>{copy.loading}</p>
      </section>
    </AppShell>
  );
}
