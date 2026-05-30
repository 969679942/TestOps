"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProjectSummaryRecord } from "../lib/workspace-api";
import { copy } from "../lib/copy";
import { CreateProjectModal } from "./create-project-modal";

export type ProjectWithStats = ProjectSummaryRecord;

type ProjectDirectoryProps = Readonly<{
  projects: ProjectWithStats[];
}>;

export function ProjectDirectory({ projects }: ProjectDirectoryProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-toolbar">
        <div>
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
          projects.map((project) => (
            <Link key={project.id} className="card project-card" href={`/projects/${project.id}`}>
              <div className="project-card-top">
                <h2>{project.name}</h2>
                <span className="project-code">{project.code}</span>
              </div>
              <p>{project.description ?? copy.noDescription}</p>
              <div className="project-stats">
                <span>
                  <strong>{project.documentCount}</strong> {copy.documents}
                </span>
                <span>
                  <strong>{project.testCaseCount}</strong> {copy.drafts}
                </span>
                <span>
                  <strong>{project.publishedCount}</strong> {copy.published}
                </span>
              </div>
            </Link>
          ))
        )}
      </section>

      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
