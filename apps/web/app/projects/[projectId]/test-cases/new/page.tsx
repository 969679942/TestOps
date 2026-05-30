import React from "react";

import Link from "next/link";



import { AppShell } from "../../../../../components/app-shell";

import { Breadcrumbs } from "../../../../../components/breadcrumbs";

import { copy } from "../../../../../lib/copy";

import { getProject } from "../../../../../lib/workspace-api";

import { loadOrThrow } from "../../../../../lib/server-load";

import { NewTestCasePageClient } from "./page-client";



type NewTestCasePageProps = {

  params: Promise<{

    projectId: string;

  }>;

};



export default async function NewTestCasePage({ params }: NewTestCasePageProps) {

  const { projectId } = await params;

  const project = await loadOrThrow(() => getProject(projectId));



  return (

    <AppShell currentPath={`/projects/${projectId}/test-cases`} project={project}>

      <Breadcrumbs

        items={[

          { label: copy.projects, href: "/" },

          { label: project.name, href: `/projects/${projectId}` },

          { label: copy.testCases, href: `/projects/${projectId}/test-cases` },

          { label: copy.composeTitle },

        ]}

      />



      <section className="page-header compact">

        <span className="eyebrow">{copy.uiAutomationEyebrow}</span>

        <h2>{copy.composeTitle}</h2>

        <p>{copy.composeHint}</p>

      </section>



      <div className="page-toolbar">

        <p className="toolbar-meta">{copy.composeToolbarHint}</p>

        <Link className="button-secondary" href={`/projects/${projectId}/test-cases`}>

          {copy.backToList}

        </Link>

      </div>



      <NewTestCasePageClient projectId={projectId} />

    </AppShell>

  );

}


