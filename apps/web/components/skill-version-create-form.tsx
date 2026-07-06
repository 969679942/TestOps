"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DEFAULT_SKILL_EVIDENCE_POLICY,
  DEFAULT_SKILL_PROMPT_TEMPLATE,
} from "../lib/skill-content-utils";
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

type SkillVersionCreateFormProps = Readonly<{
  skillId: string;
  productionVersion: GlobalSkillVersionRecord | null;
  createAction: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
}>;

export function SkillVersionCreateForm({
  skillId,
  productionVersion,
  createAction,
  onSuccess,
}: SkillVersionCreateFormProps) {
  const router = useRouter();
  const defaults = productionVersion ?? null;
  const [fieldErrors, setFieldErrors] = useState<SkillVersionDraftFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateSkillVersionDraftForm(formData);
    setFieldErrors(nextErrors);
    setSubmitError(null);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await createAction(formData);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "创建版本失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={createAction} className="review-stack" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="skillId" value={skillId} />
      {submitError ? <p className="field-error">{submitError}</p> : null}
      <label className="form-field skill-form-field-wide">
        <FieldLabel required>{skillFieldLabels.promptTemplate}</FieldLabel>
        <textarea
          className={`field-input skill-prompt-editor${fieldErrors.promptTemplate ? " is-invalid" : ""}`}
          name="promptTemplate"
          rows={10}
          defaultValue={defaults?.promptTemplate ?? DEFAULT_SKILL_PROMPT_TEMPLATE}
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
          className={`field-input${fieldErrors.evidencePolicy ? " is-invalid" : ""}`}
          name="evidencePolicy"
          rows={3}
          defaultValue={defaults?.evidencePolicy ?? DEFAULT_SKILL_EVIDENCE_POLICY}
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
            <FieldLabel>版本标签</FieldLabel>
            <input className="field-input" name="versionLabel" placeholder="v2 草稿" />
          </label>
          <SkillTokenChipSelect
            name="scenarioTaxonomy"
            label={skillFieldLabels.scenarioTaxonomy}
            options={scenarioTaxonomyOptions}
            defaultValues={defaults?.scenarioTaxonomy ?? []}
          />
          <SkillTokenChipSelect
            name="reviewChecklist"
            label={skillFieldLabels.reviewChecklist}
            options={reviewChecklistOptions}
            defaultValues={defaults?.reviewChecklist ?? ["traceable"]}
          />
          <SkillTokenChipSelect
            name="coverageDimensions"
            label={skillFieldLabels.coverageDimensions}
            options={coverageDimensionOptions}
            defaultValues={defaults?.coverageDimensions ?? ["core_user_journey"]}
          />
          <label className="form-field">
            <FieldLabel>归档地址</FieldLabel>
            <input className="field-input" name="storageUri" placeholder="oss://skills/skill/v2.zip" />
          </label>
        </div>
      </details>
      <button className="button-secondary" type="submit" disabled={submitting}>
        {submitting ? "保存中…" : "保存草稿版本"}
      </button>
    </form>
  );
}
