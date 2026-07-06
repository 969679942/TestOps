"use client";

import { useRef, useState } from "react";

import {
  hasFieldErrors,
  validateSkillVersionDraftForm,
  type SkillVersionDraftFieldErrors,
} from "../lib/skill-form-validation";
import {
  coverageDimensionOptions,
  reviewChecklistOptions,
  scenarioTaxonomyOptions,
  skillFieldLabels,
} from "../lib/skill-copy";
import type { GlobalSkillVersionRecord } from "../lib/types";
import { FieldLabel } from "./field-label";
import { SkillTokenChipSelect } from "./skill-token-chip-select";
import { SkillVersionPublishAction } from "./skill-version-publish-action";
import { SkillVersionRollbackAction } from "./skill-version-rollback-action";

type SkillVersionEditorFormProps = Readonly<{
  version: GlobalSkillVersionRecord;
  updateAction: (formData: FormData) => Promise<void>;
  publishAction: (formData: FormData) => Promise<void>;
  rollbackAction: (formData: FormData) => Promise<void>;
}>;

function buildMarkdown(version: GlobalSkillVersionRecord) {
  return [
    `# ${version.versionLabel}`,
    "",
    "## 提示词模板",
    version.promptTemplate,
    "",
    "## 证据策略",
    version.evidencePolicy,
    "",
    "## 场景分类",
    version.scenarioTaxonomy.join(", "),
    "",
    "## 覆盖维度",
    version.coverageDimensions.join(", "),
    "",
    "## 评审清单",
    version.reviewChecklist.join(", "),
  ].join("\n");
}

export function SkillVersionEditorForm({
  version,
  updateAction,
  publishAction,
  rollbackAction,
}: SkillVersionEditorFormProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const evidenceRef = useRef<HTMLTextAreaElement>(null);
  const importRef = useRef<HTMLTextAreaElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SkillVersionDraftFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateSkillVersionDraftForm(formData);
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await updateAction(formData);
    } finally {
      setSubmitting(false);
    }
  }

  function exportMarkdown() {
    const blob = new Blob([buildMarkdown(version)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${version.versionLabel.replace(/\s+/g, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function applyImportedMarkdown() {
    const raw = importRef.current?.value.trim();
    if (!raw || !promptRef.current || !evidenceRef.current) {
      return;
    }

    const promptMatch = raw.match(/## 提示词模板\s*\n([\s\S]*?)(?=\n## |$)/);
    const evidenceMatch = raw.match(/## 证据策略\s*\n([\s\S]*?)(?=\n## |$)/);
    if (promptMatch?.[1]) {
      promptRef.current.value = promptMatch[1].trim();
    }
    if (evidenceMatch?.[1]) {
      evidenceRef.current.value = evidenceMatch[1].trim();
    }
    setImportOpen(false);
  }

  return (
    <form action={updateAction} className="review-stack" onSubmit={handleSubmit} noValidate>
      <div className="skill-version-editor-toolbar">
        <button className="button-secondary" type="button" onClick={exportMarkdown}>
          导出 Markdown
        </button>
        <button className="button-ghost" type="button" onClick={() => setImportOpen((open) => !open)}>
          {importOpen ? "取消导入" : "导入 Markdown"}
        </button>
      </div>

      {importOpen ? (
        <div className="skill-markdown-import">
          <label className="form-field skill-form-field-wide">
            <span>粘贴 Markdown 内容</span>
            <textarea
              ref={importRef}
              className="field-input"
              rows={8}
              placeholder={"## 提示词模板\n...\n\n## 证据策略\n..."}
            />
          </label>
          <button className="button-secondary" type="button" onClick={applyImportedMarkdown}>
            应用到编辑器
          </button>
        </div>
      ) : null}

      <div className="form-grid">
        <label className="form-field skill-form-field-wide">
          <FieldLabel required>{skillFieldLabels.promptTemplate}</FieldLabel>
          <textarea
            ref={promptRef}
            className={`field-input skill-prompt-editor${fieldErrors.promptTemplate ? " is-invalid" : ""}`}
            name="promptTemplate"
            rows={12}
            defaultValue={version.promptTemplate}
            aria-invalid={fieldErrors.promptTemplate ? "true" : "false"}
            onChange={() => {
              if (fieldErrors.promptTemplate) {
                setFieldErrors((current) => ({ ...current, promptTemplate: undefined }));
              }
            }}
          />
          {fieldErrors.promptTemplate ? <p className="field-error">{fieldErrors.promptTemplate}</p> : null}
        </label>
        <label className="form-field skill-form-field-wide">
          <FieldLabel required>{skillFieldLabels.evidencePolicy}</FieldLabel>
          <textarea
            ref={evidenceRef}
            className={`field-input${fieldErrors.evidencePolicy ? " is-invalid" : ""}`}
            name="evidencePolicy"
            rows={4}
            defaultValue={version.evidencePolicy}
            aria-invalid={fieldErrors.evidencePolicy ? "true" : "false"}
            onChange={() => {
              if (fieldErrors.evidencePolicy) {
                setFieldErrors((current) => ({ ...current, evidencePolicy: undefined }));
              }
            }}
          />
          {fieldErrors.evidencePolicy ? <p className="field-error">{fieldErrors.evidencePolicy}</p> : null}
        </label>
        <details className="skill-advanced-panel skill-form-field-wide">
          <summary>更多选项（可选）</summary>
          <div className="form-grid">
            <label className="form-field">
              <FieldLabel>{skillFieldLabels.versionLabel}</FieldLabel>
              <input className="field-input" name="versionLabel" defaultValue={version.versionLabel} />
            </label>
            <SkillTokenChipSelect
              name="scenarioTaxonomy"
              label={skillFieldLabels.scenarioTaxonomy}
              options={scenarioTaxonomyOptions}
              defaultValues={version.scenarioTaxonomy}
            />
            <SkillTokenChipSelect
              name="coverageDimensions"
              label={skillFieldLabels.coverageDimensions}
              options={coverageDimensionOptions}
              defaultValues={version.coverageDimensions}
            />
            <SkillTokenChipSelect
              name="reviewChecklist"
              label={skillFieldLabels.reviewChecklist}
              options={reviewChecklistOptions}
              defaultValues={version.reviewChecklist}
              helperText="评审清单会在用例评审阶段作为检查项参考，不参与生成 Prompt 拼接。"
            />
            <label className="form-field">
              <span>{skillFieldLabels.storageUri}</span>
              <input
                className="field-input"
                name="storageUri"
                defaultValue={version.storageUri ?? ""}
                placeholder="oss://skills/pkg/v2.zip 或 git+https://..."
              />
            </label>
            <label className="form-field">
              <FieldLabel>{skillFieldLabels.changeLog}</FieldLabel>
              <textarea
                className="field-input"
                name="changeLog"
                rows={2}
                defaultValue={version.changeLog ?? ""}
                placeholder="可选：记录本次修改点"
              />
            </label>
            <label className="form-field">
              <FieldLabel>{skillFieldLabels.releaseNotes}</FieldLabel>
              <textarea
                className="field-input"
                name="releaseNotes"
                rows={2}
                defaultValue={version.releaseNotes ?? ""}
                placeholder="可选"
              />
            </label>
          </div>
        </details>
      </div>
      <div className="project-context-actions">
        <button className="button-primary" type="submit" disabled={submitting}>
          {submitting ? "保存中…" : "保存草稿"}
        </button>
        <SkillVersionPublishAction
          action={publishAction}
          versionId={String(version.id)}
          versionLabel={version.versionLabel}
        />
        <SkillVersionRollbackAction
          action={rollbackAction}
          versionId={String(version.id)}
          versionLabel={version.versionLabel}
        />
      </div>
    </form>
  );
}
