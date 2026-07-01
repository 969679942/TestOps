import React from "react";

import { AppShell } from "../../../../components/app-shell";
import { DocumentUploadPanel } from "../../../../components/document-upload-panel";
import { ProjectArchiveBanner } from "../../../../components/project-archive-banner";
import {
  getProject,
  listDocumentVersions,
  listProjectDocuments,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import { translateProjectName } from "../../../../lib/project-display";
import type { DocumentVersionRecord } from "../../../../lib/types";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

function buildVersionHighlights(version: DocumentVersionRecord): string[] {
  const metadata = version.structuredMetadata;
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const entries: string[] = [];
  const pushCount = (label: string, key: string) => {
    const rawValue = metadata[key];
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      entries.push(`${rawValue.length} ${label}`);
    }
  };

  pushCount("验收标准", "acceptance_criteria");
  pushCount("需求项", "requirement_items");
  pushCount("业务规则", "business_rules");
  pushCount("边界场景", "edge_cases");
  pushCount("规则", "rules");
  pushCount("约束", "constraints");
  pushCount("补充说明", "clarifications");
  pushCount("待澄清点", "open_questions");
  pushCount("接口", "operations");
  pushCount("节点", "nodes");
  return entries.slice(0, 4);
}

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind !== "success") {
    const title =
      projectResult.kind === "not-found"
        ? t.states.projectNotFound
        : t.states.projectUnavailable;
    const description =
      projectResult.kind === "not-found"
        ? t.states.projectNotFoundCopy
        : projectResult.kind === "unavailable"
          ? t.states.apiUnavailable
          : t.states.apiError;

    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;
  const archived = project.status === "archived";
  const documentsResult = await listProjectDocuments(projectId);
  const documents = documentsResult.kind === "success" ? documentsResult.documents : [];
  const workspaceDocuments = documents.map((document) => ({
    ...document,
    id: String(document.id),
    projectId: String(document.projectId),
  }));
  const versionResults = await Promise.all(
    documents.map(async (document) => ({
      documentId: String(document.id),
      versions: await listDocumentVersions(String(document.id)),
    })),
  );

  return (
    <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale} project={project}>
      <section className="page-header">
        <span className="eyebrow">{t.documentsPage.eyebrow}</span>
        <h2>{t.documentsPage.eyebrow}</h2>
        <p>
          当前项目：{translateProjectName(project.name, locale)}。{t.documentsPage.description}
        </p>
      </section>

      {archived ? (
        <ProjectArchiveBanner />
      ) : (
        <DocumentUploadPanel
          projectId={projectId}
          documents={workspaceDocuments}
          defaultProvider={project.defaultProvider}
          showDocumentLibrary={false}
        />
      )}

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Document Center</span>
            <h3>{t.documentsPage.documents}</h3>
          </div>
          <p>查看每份文档的版本、解析状态和当前可用于生成的输入。</p>
        </div>

        {documents.length === 0 ? (
          <p>{t.components.noDocuments}</p>
        ) : (
          <div className="review-stack">
            {documents.map((document) => {
              const versionResult = versionResults.find(
                (item) => item.documentId === String(document.id),
              )?.versions;
              const versions = versionResult?.kind === "success" ? versionResult.data : [];
              const latestVersion = versions.at(-1) ?? null;
              const latestHighlights = latestVersion ? buildVersionHighlights(latestVersion) : [];
              return (
                <article className="data-card" key={document.id}>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">{document.type}</span>
                      <h3>{document.name}</h3>
                    </div>
                    <span className="status-pill">{document.parseStatus ?? "pending"}</span>
                  </div>
                  <p>{document.sourceUri ?? "stored internally"}</p>
                  {latestVersion ? (
                    <div className="review-stack">
                      <article className="review-meta-card">
                        <span className="eyebrow">Latest Parse</span>
                        <p className="summary-value">{latestVersion.parseSummary ?? "已入库，等待解析摘要"}</p>
                        <p>
                          {latestHighlights.length > 0
                            ? latestHighlights.join(" | ")
                            : "当前尚未提取到结构化亮点"}
                        </p>
                      </article>
                    </div>
                  ) : null}
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Status</th>
                          <th>Summary</th>
                          <th>Highlights</th>
                        </tr>
                      </thead>
                      <tbody>
                        {versions.length > 0 ? (
                          versions.map((version) => (
                            <tr key={version.id}>
                              <td>v{version.versionNo}</td>
                              <td>{version.parseStatus}</td>
                              <td>{version.parseSummary ?? "No parse summary yet"}</td>
                              <td>
                                {buildVersionHighlights(version).join(" / ") || "No structured signals"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4}>No versions yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="workspace-links" aria-label={t.documentsPage.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/generation-tasks`, locale)}
        >
          <span className="eyebrow">{t.documentsPage.nextStep}</span>
          <h3>{t.documentsPage.generationTasks}</h3>
          <p>{t.documentsPage.nextCopy}</p>
        </a>
        <a className="workspace-link" href={localizedHref(`/projects/${projectId}/skills`, locale)}>
          <span className="eyebrow">Skills</span>
          <h3>项目技能</h3>
          <p>查看共享 Skill 绑定和历史兼容配置，确认当前生成任务会使用哪套规则。</p>
        </a>
      </section>
    </AppShell>
  );
}
