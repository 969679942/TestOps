import React from "react";
import { revalidatePath } from "next/cache";
import { AppShell } from "../../../../components/app-shell";
import { DocumentTable } from "../../../../components/document-table";
import {
  createDocumentVersion,
  createProjectDocument,
  getProject,
  listProjectDocuments,
  parseDocumentVersion,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.workspace}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/documents`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.documentsPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const documentList = await listProjectDocuments(projectId);
  const documents = documentList.kind === "http-error" ? [] : documentList.documents;

  async function createDocumentAction(formData: FormData) {
    "use server";

    const read = (name: string) => {
      const value = formData.get(name);
      return typeof value === "string" ? value.trim() : "";
    };
    const type = read("type") || "prd";
    const name = read("name") || (locale === "zh" ? "未命名文档" : "Untitled document");
    const sourceUri = read("sourceUri");
    const filename = read("filename");
    const content = read("content");
    const sourceMode = content ? "upload" : "url";

    const assetResult = await createProjectDocument(projectId, {
      type,
      name,
      source_mode: sourceMode,
      source_uri: sourceUri || null,
    });

    if (assetResult.kind === "success" && (content || sourceUri)) {
      const versionResult = await createDocumentVersion(String(assetResult.data.id), {
        filename: filename || null,
        content: content || null,
        source_uri: sourceUri || null,
      });

      if (versionResult.kind === "success" && formData.get("triggerParse") === "on") {
        await parseDocumentVersion(String(versionResult.data.id));
      }
    }

    revalidatePath(`/projects/${projectId}/documents`);
  }

  return (
    <AppShell
      currentPath={`/projects/${projectId}/documents`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{t.documentsPage.eyebrow}</span>
        <h2>{project.name}</h2>
        <p>{t.documentsPage.description}</p>
      </section>

      <section className="summary-grid" aria-label={t.documentsPage.summary}>
        <article className="summary-card">
          <span className="eyebrow">{t.documentsPage.documents}</span>
          <p className="summary-value">
            {documentList.kind === "http-error" ? t.states.unavailable : documents.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.documentsPage.projectProvider}</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.documentsPage.promptProfile}</span>
          <p className="summary-value">{project.defaultPromptProfile}</p>
        </article>
      </section>

      {documentList.kind === "unavailable" ? (
        <section>
          <p>{t.documentsPage.fallback}</p>
        </section>
      ) : null}

      {documentList.kind === "http-error" ? (
        <section>
          <p>{t.documentsPage.error}</p>
        </section>
      ) : null}

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.documentsPage.workspace}</span>
            <h3>{t.documentsPage.attachTitle}</h3>
          </div>
          <p>{t.documentsPage.attachCopy}</p>
        </div>
        <form action={createDocumentAction} className="review-stack">
          <div className="form-grid">
            <label className="form-field">
              <span>{t.documentsPage.documentName}</span>
              <input className="field-input" name="name" required />
            </label>
            <label className="form-field">
              <span>{t.documentsPage.documentType}</span>
              <select className="field-input" name="type" defaultValue="prd">
                <option value="prd">PRD</option>
                <option value="figma">Figma</option>
                <option value="swagger">Swagger</option>
              </select>
            </label>
            <label className="form-field">
              <span>{t.documentsPage.sourceUrl}</span>
              <input className="field-input" name="sourceUri" type="url" />
            </label>
            <label className="form-field">
              <span>{t.documentsPage.filename}</span>
              <input className="field-input" name="filename" placeholder="prd.md" />
            </label>
          </div>
          <label className="form-field">
            <span>{t.documentsPage.content}</span>
            <textarea className="field-textarea" name="content" />
          </label>
          <label className="inline-check">
            <input name="triggerParse" type="checkbox" defaultChecked />
            <span>{t.documentsPage.triggerParse}</span>
          </label>
          <button className="primary-button" type="submit">
            {t.documentsPage.save}
          </button>
        </form>
      </section>

      <DocumentTable items={documents} locale={locale} />

      <section className="workspace-links" aria-label={t.documentsPage.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/generation-tasks`, locale)}
        >
          <span className="eyebrow">{t.documentsPage.nextStep}</span>
          <h3>{t.documentsPage.generationTasks}</h3>
          <p>{t.documentsPage.nextCopy}</p>
        </a>
        <article className="workspace-link">
          <span className="eyebrow">{t.documentsPage.traceability}</span>
          <h3>{t.documentsPage.sourceVisibility}</h3>
          <p>{t.documentsPage.sourceCopy}</p>
        </article>
      </section>
    </AppShell>
  );
}
