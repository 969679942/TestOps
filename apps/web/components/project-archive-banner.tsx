import { copy } from "../lib/copy";

export function ProjectArchiveBanner() {
  return (
    <section className="project-archive-banner" role="status">
      <div className="project-archive-banner-copy">
        <span className="eyebrow">{copy.projectArchived}</span>
        <h3>{copy.projectArchived}</h3>
        <p>{copy.projectArchivedHint}</p>
      </div>
    </section>
  );
}
