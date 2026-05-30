import React from "react";

import Link from "next/link";

import { AppShell } from "../../../components/app-shell";

import { Breadcrumbs } from "../../../components/breadcrumbs";

import { ProjectWorkspaceClient } from "../../../components/project-workspace-client";

import { copy } from "../../../lib/copy";

import {

  getProject,

  listProjectDocuments,

  listProjectTestCases,

} from "../../../lib/workspace-api";

import { loadOrThrow } from "../../../lib/server-load";



type ProjectPageProps = {

  params: Promise<{

    projectId: string;

  }>;

};



export default async function ProjectWorkspacePage({ params }: ProjectPageProps) {

  const { projectId } = await params;

  const [project, documents, testCases] = await loadOrThrow(() =>

    Promise.all([

      getProject(projectId),

      listProjectDocuments(projectId),

      listProjectTestCases(projectId),

    ]),

  );



  return (

    <AppShell

      currentPath={`/projects/${projectId}`}

      project={project}

      testCaseCount={testCases.length}

    >

      <Breadcrumbs

        items={[

          { label: copy.projects, href: "/" },

          { label: project.name },

        ]}

      />



      <section className="page-header">

        <span className="eyebrow">{copy.workspaceEyebrow}</span>

        <h2>{project.name}</h2>

        <p>{project.description ?? copy.defaultProjectHint}</p>

      </section>



      <ProjectWorkspaceClient

        projectId={projectId}

        project={project}

        documents={documents}

        testCases={testCases}

      />



      {testCases.length > 0 ? (

        <section className="next-step-banner">

          <div>

            <span className="eyebrow">{copy.nextStepEyebrow}</span>

            <h3>{copy.nextStepTitle(testCases.length)}</h3>

            <p>{copy.nextStepHint}</p>

          </div>

          <Link className="button-primary" href={`/projects/${projectId}/test-cases`}>

            {copy.testCases}

          </Link>

        </section>

      ) : null}

    </AppShell>

  );

}


