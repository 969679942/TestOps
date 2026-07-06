"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  downloadSkillMarkdownTemplate,
  parseSkillMarkdownFile,
  type SkillMarkdownImportRecord,
} from "../lib/skill-markdown-import";
import { FileUploadField } from "./file-upload-field";

type SkillImportPanelProps = Readonly<{
  importAction: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
}>;

export function SkillImportPanel({ importAction, onSuccess }: SkillImportPanelProps) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [parsedSkills, setParsedSkills] = useState<SkillMarkdownImportRecord[] | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFileChange(file: File | null) {
    setToast(null);
    setParsedSkills(null);
    setPreviewCount(0);
    setFileName(null);

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const skills = parseSkillMarkdownFile(text);
      setFileName(file.name);
      setPreviewCount(skills.length);
      setParsedSkills(skills);
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : "无法解析 Skill 文件。";
      setToast({ type: "error", text: message });
    }
  }

  async function handleImport() {
    if (!parsedSkills || parsedSkills.length === 0) {
      setToast({ type: "error", text: "请先选择有效的 Markdown Skill 文件。" });
      return;
    }

    setImporting(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.set("skillsJson", JSON.stringify(parsedSkills));
      await importAction(formData);
      router.refresh();
      onSuccess?.();
    } catch (importError) {
      const message =
        importError instanceof Error ? importError.message : "导入 Skill 失败，请稍后重试。";
      setToast({ type: "error", text: message });
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="upload-panel" aria-label="导入 Skill">
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.text}</div> : null}

      {importing ? (
        <div className="loading-banner" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>正在导入 Skill…</strong>
            <p>正在写入 {previewCount} 条 Skill，请稍候…</p>
          </div>
        </div>
      ) : null}

      <div className="upload-panel-header">
        <button className="button-ghost" type="button" onClick={downloadSkillMarkdownTemplate}>
          下载模板
        </button>
      </div>

      <div className="import-panel-body">
        <div className="field">
          <span>Skill 文件（Markdown）</span>
          <FileUploadField
            accept=".md,.markdown,text/markdown"
            disabled={importing}
            fileName={fileName}
            onFileChange={handleFileChange}
          />
          <small>模板采用 Markdown 结构；多条 Skill 用 --- 分隔，重点填写提示词与证据策略。</small>
        </div>

        {fileName ? (
          <article className="import-preview-card">
            <div className="import-preview-card-header">
              <div>
                <span className="eyebrow">导入预览</span>
                <strong>{fileName}</strong>
              </div>
              <span className="status-pill">共 {previewCount} 条 Skill</span>
            </div>
            {parsedSkills && parsedSkills.length > 0 ? (
              <ul className="import-preview-list">
                {parsedSkills.slice(0, 5).map((item, index) => (
                  <li key={`${item.skillKey || item.name}-${index}`}>
                    {item.name || item.skillKey}
                  </li>
                ))}
                {parsedSkills.length > 5 ? <li>另有 {parsedSkills.length - 5} 条 Skill</li> : null}
              </ul>
            ) : null}
          </article>
        ) : (
          <article className="empty-card compact">
            <h4>尚未选择文件</h4>
            <p>可下载模板，按格式填写后上传 Markdown 文件。</p>
          </article>
        )}

        <div className="import-actions">
          <button
            className="button-primary"
            type="button"
            disabled={importing || !parsedSkills || parsedSkills.length === 0}
            onClick={handleImport}
          >
            {importing ? "导入中…" : "导入 Skill"}
          </button>
        </div>
      </div>
    </section>
  );
}
