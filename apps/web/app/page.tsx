import React from "react";
import { AppShell } from "../components/app-shell";
import { listProjects } from "../lib/api";

export default async function HomePage() {
  const projectList = await listProjects();

  return (
    <AppShell currentPath="/">
      <section className="page-header">
        <span className="eyebrow">Project Directory</span>
        <h2>Projects</h2>
        <p>
          Manage project workspaces, keep document evidence close to the product
          context, and prepare the ground for generation and review tasks.
        </p>
      </section>

      <section className="project-grid" aria-label="Projects">
        {projectList.kind === "http-error" ? (
          <article className="card">
            <h2>Projects are temporarily unavailable</h2>
            <p>
              The workspace API returned an error while loading the project directory.
            </p>
          </article>
        ) : (
          projectList.projects.map((project) => (
            <a key={project.id} className="card" href={`/projects/${project.id}`}>
              <h2>{project.name}</h2>
              <p>{project.description ?? "No project description yet."}</p>
              <div className="card-meta">
                <strong>{project.code}</strong> - provider {project.defaultProvider}
              </div>
            </a>
          ))
        )}
      </section>
    </AppShell>
  );
}
