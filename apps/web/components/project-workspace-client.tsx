"use client";

import { useMemo, useState } from "react";

import type { ProjectDocumentRecord, ProjectRecord, TestCaseRecord } from "../lib/workspace-api";
import { ProjectWorkspaceTabs } from "./project-workspace-tabs";
import { WorkflowSteps } from "./workflow-steps";

type ProjectWorkspaceClientProps = Readonly<{
  projectId: string;
  project: ProjectRecord;
  documents: ProjectDocumentRecord[];
  testCases: TestCaseRecord[];
}>;

export function ProjectWorkspaceClient({
  projectId,
  project,
  documents,
  testCases,
}: ProjectWorkspaceClientProps) {
  const [generating, setGenerating] = useState(false);
  const publishedCount = useMemo(
    () => testCases.filter((item) => item.status === "published").length,
    [testCases],
  );

  return (
    <>
      <WorkflowSteps
        projectId={projectId}
        currentStep={generating ? "generate" : "upload"}
        documentCount={documents.length}
        testCaseCount={testCases.length}
        publishedCount={publishedCount}
        generating={generating}
      />

      <ProjectWorkspaceTabs
        projectId={projectId}
        documents={documents}
        defaultProvider={project.defaultProvider}
        onGeneratingChange={setGenerating}
        projectStatus={project.status as "active" | "archived"}
      />
    </>
  );
}
