"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, importTestCases } from "../lib/workspace-api";
import { copy } from "../lib/copy";
import {
  downloadImportTemplate,
  parseTestCaseImportFile,
} from "../lib/test-case-import";
import { serializeDraftForApi } from "../lib/ui-automation-case";
import { FileUploadField } from "./file-upload-field";

type TestCaseImportPanelProps = Readonly<{
  projectId: string;
}>;

export function TestCaseImportPanel({ projectId }: TestCaseImportPanelProps) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [parsedCases, setParsedCases] = useState<ReturnType<typeof parseTestCaseImportFile> | null>(
    null,
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFileChange(file: File | null) {
    setToast(null);
    setParsedCases(null);
    setPreviewCount(0);
    setFileName(null);

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      const cases = parseTestCaseImportFile(payload);
      setFileName(file.name);
      setPreviewCount(cases.length);
      setParsedCases(cases);
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : copy.parseImportFailed;
      setToast({ type: "error", text: message });
    }
  }

  async function handleImport() {
    if (!parsedCases || parsedCases.length === 0) {
      setToast({ type: "error", text: copy.chooseValidImportFile });
      return;
    }

    setImporting(true);
    setToast(null);

    try {
      const imported = await importTestCases(
        projectId,
        parsedCases.map((item) => serializeDraftForApi(item)),
      );
      router.push(`/projects/${projectId}/test-cases?imported=${imported.length}`);
      router.refresh();
    } catch (importError) {
      const message =
        importError instanceof ApiError
          ? importError.message
          : importError instanceof Error
            ? importError.message
            : copy.importFailed;
      setToast({ type: "error", text: message });
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="upload-panel" aria-label="导入用例">
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.text}</div> : null}

      {importing ? (
        <div className="loading-banner" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>{copy.importing}</strong>
            <p>{copy.importProgress(previewCount)}</p>
          </div>
        </div>
      ) : null}

      <div className="upload-panel-header">
        <div>
          <span className="eyebrow">{copy.skipGenerateEyebrow}</span>
          <h3>{copy.importTitle}</h3>
          <p>{copy.importHint}</p>
        </div>
        <div className="inline-actions">
          <button className="button-ghost" type="button" onClick={downloadImportTemplate}>
            {copy.downloadTemplate}
          </button>
          <Link className="button-secondary" href={`/projects/${projectId}/test-cases/new`}>
            {copy.composeOrImport}
          </Link>
        </div>
      </div>

      <div className="import-panel-body">
        <div className="field">
          <span>{copy.importFileLabel}</span>
          <FileUploadField
            accept=".json,application/json"
            disabled={importing}
            fileName={fileName}
            onFileChange={handleFileChange}
          />
          <small>{copy.importTemplateHint}</small>
        </div>

        {fileName ? (
          <article className="import-preview-card">
            <strong>{fileName}</strong>
            <p>{copy.importPreviewSummary(previewCount)}</p>
            {parsedCases && parsedCases.length > 0 ? (
              <ul className="import-preview-list">
                {parsedCases.slice(0, 5).map((item, index) => (
                  <li key={`${item.title}-${index}`}>{item.title}</li>
                ))}
                {parsedCases.length > 5 ? (
                  <li>… 另有 {parsedCases.length - 5} 条</li>
                ) : null}
              </ul>
            ) : null}
          </article>
        ) : (
          <article className="empty-card compact">
            <h4>{copy.importEmptyTitle}</h4>
            <p>{copy.importEmptyHint}</p>
          </article>
        )}

        <button
          className="button-primary"
          type="button"
          disabled={importing || !parsedCases || parsedCases.length === 0}
          onClick={handleImport}
        >
          {importing ? copy.importing : copy.importAction}
        </button>
      </div>
    </section>
  );
}
