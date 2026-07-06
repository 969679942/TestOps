"use client";

import { useState } from "react";

import {
  DEFAULT_SKILL_EVIDENCE_POLICY,
  DEFAULT_SKILL_PROMPT_TEMPLATE,
} from "../lib/skill-content-utils";
import {
  hasFieldErrors,
  validateSkillCreateForm,
  type SkillCreateFieldErrors,
} from "../lib/skill-form-validation";
import {
  skillCategoryOptions,
  skillDomainOptions,
  skillFieldLabels,
  skillInputTypeOptions,
} from "../lib/skill-copy";
import { FieldLabel } from "./field-label";
import { SkillTokenChipSelect } from "./skill-token-chip-select";

type SkillCreateFormProps = Readonly<{
  createAction: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
}>;

export function SkillCreateForm({ createAction, onSuccess }: SkillCreateFormProps) {
  const [fieldErrors, setFieldErrors] = useState<SkillCreateFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateSkillCreateForm(formData);
    setFieldErrors(nextErrors);
    setSubmitError(null);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await createAction(formData);
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "创建 Skill 失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={createAction} className="form-grid" onSubmit={handleSubmit} noValidate>
      {submitError ? <p className="field-error skill-form-field-wide">{submitError}</p> : null}
      <SkillTokenChipSelect
        name="inputTypes"
        label={skillFieldLabels.inputTypes}
        options={skillInputTypeOptions}
        defaultValues={["prd"]}
        helperText="选择支持的资料类型，创建后可直接编写提示词内容。"
      />
      <label className="form-field skill-form-field-wide">
        <FieldLabel required>{skillFieldLabels.promptTemplate}</FieldLabel>
        <textarea
          className="field-input skill-prompt-editor"
          name="promptTemplate"
          rows={10}
          defaultValue={DEFAULT_SKILL_PROMPT_TEMPLATE}
          placeholder="编写该 Skill 的测试生成提示词…"
        />
      </label>
      <label className="form-field skill-form-field-wide">
        <FieldLabel required>{skillFieldLabels.evidencePolicy}</FieldLabel>
        <textarea
          className="field-input"
          name="evidencePolicy"
          rows={3}
          defaultValue={DEFAULT_SKILL_EVIDENCE_POLICY}
        />
      </label>
      <details className="skill-advanced-panel skill-form-field-wide">
        <summary>目录信息（可选）</summary>
        <div className="form-grid">
          <label className="form-field">
            <FieldLabel>{skillFieldLabels.skillKey}</FieldLabel>
            <input
              className={`field-input${fieldErrors.skillKey ? " is-invalid" : ""}`}
              name="skillKey"
              placeholder="留空将自动生成"
              aria-invalid={fieldErrors.skillKey ? "true" : "false"}
              onChange={() => {
                if (fieldErrors.skillKey) {
                  setFieldErrors((current) => ({ ...current, skillKey: undefined }));
                }
              }}
            />
            {fieldErrors.skillKey ? <p className="field-error">{fieldErrors.skillKey}</p> : null}
          </label>
          <label className="form-field">
            <FieldLabel>名称</FieldLabel>
            <input className="field-input" name="name" placeholder="留空将使用默认名称" />
          </label>
          <label className="form-field">
            <FieldLabel>分类</FieldLabel>
            <select className="field-input" name="category" defaultValue="">
              <option value="">留空（默认核心）</option>
              {skillCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <FieldLabel>领域</FieldLabel>
            <select className="field-input" name="domain" defaultValue="">
              <option value="">留空（默认通用）</option>
              {skillDomainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field skill-form-field-wide">
            <FieldLabel>描述</FieldLabel>
            <textarea className="field-input" name="description" rows={2} placeholder="可选" />
          </label>
        </div>
      </details>
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "创建中…" : "创建并编辑"}
      </button>
    </form>
  );
}
