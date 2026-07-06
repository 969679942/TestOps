"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProjectDocumentRecord, ProjectRecord } from "../lib/workspace-api";
import { ProjectWorkspaceTabs } from "./project-workspace-tabs";
import { WorkflowSteps } from "./workflow-steps";

type ProjectWorkspaceClientProps = Readonly<{
  projectId: string;
  project: ProjectRecord;
  documents: ProjectDocumentRecord[];
  testCaseCount: number;
  publishedCount: number;
  draftCount?: number;
  pendingReviewCount?: number;
  failedTaskCount?: number;
  defaultMode?: "generate" | "import";
}>;

export function ProjectWorkspaceClient({
  projectId,
  project,
  documents,
  testCaseCount,
  publishedCount,
  draftCount = 0,
  pendingReviewCount = 0,
  failedTaskCount = 0,
  defaultMode,
}: ProjectWorkspaceClientProps) {
  const [generating, setGenerating] = useState(false);

  const currentStep =
    publishedCount > 0
      ? "publish"
      : testCaseCount > 0
        ? generating
          ? "generate"
          : "edit"
        : documents.length > 0
          ? "generate"
          : "upload";

  return (
    <>
      <section className="workspace-todo-grid" aria-label="项目摘要">
        <article className="workspace-todo-card">
          <span className="eyebrow">文档</span>
          <strong>{documents.length}</strong>
          <small>已上传资料</small>
        </article>
        <article className="workspace-todo-card">
          <span className="eyebrow">草稿</span>
          <strong>{draftCount || testCaseCount}</strong>
          <small>待编辑或评审</small>
        </article>
        <Link
          className={`workspace-todo-card workspace-todo-card-link ${pendingReviewCount > 0 ? "is-alert" : ""}`}
          href={`/projects/${projectId}/review`}
        >
          <span className="eyebrow">待评审</span>
          <strong>{pendingReviewCount}</strong>
          <small>点击进入评审页</small>
        </Link>
        <Link
          className={`workspace-todo-card workspace-todo-card-link ${failedTaskCount > 0 ? "is-alert" : ""}`}
          href={`/projects/${projectId}/generation-tasks?focus=failed`}
        >
          <span className="eyebrow">失败任务</span>
          <strong>{failedTaskCount}</strong>
          <small>{failedTaskCount > 0 ? "点击查看失败原因" : "暂无失败任务"}</small>
        </Link>
      </section>

      <WorkflowSteps
        projectId={projectId}
        currentStep={currentStep}
        documentCount={documents.length}
        testCaseCount={testCaseCount}
        publishedCount={publishedCount}
        generating={generating}
      />

      <ProjectWorkspaceTabs
        projectId={projectId}
        documents={documents}
        defaultProvider={project.defaultProvider}
        defaultMode={defaultMode}
        onGeneratingChange={setGenerating}
        projectStatus={project.status as "active" | "archived"}
      />
    </>
  );
}
