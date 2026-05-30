import React from "react";

import { AppShell } from "../components/app-shell";

import { ProjectDirectory } from "../components/project-directory";

import { copy } from "../lib/copy";

import { ApiError, listProjectsWithStats } from "../lib/workspace-api";



export default async function HomePage() {

  let projects: Awaited<ReturnType<typeof listProjectsWithStats>> = [];

  let loadError: string | null = null;



  try {

    projects = await listProjectsWithStats();

  } catch (error) {

    loadError =

      error instanceof ApiError ? error.message : copy.apiUnavailable;

  }



  return (

    <AppShell currentPath="/">

      <section className="page-header">

        <span className="eyebrow">{copy.projectDirectoryEyebrow}</span>

        <h2>{copy.projectDirectoryTitle}</h2>

        <p>{copy.projectDirectoryHint}</p>

      </section>



      {loadError ? (

        <section className="alert-panel" role="alert">

          <h3>{copy.apiUnavailableTitle}</h3>

          <p>{loadError}</p>

        </section>

      ) : (

        <ProjectDirectory projects={projects} />

      )}

    </AppShell>

  );

}


