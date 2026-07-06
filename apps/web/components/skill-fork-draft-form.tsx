"use client";

import { useState } from "react";

import {
  hasFieldErrors,
  validateSkillForkDraftForm,
  type SkillForkDraftFieldErrors,
} from "../lib/skill-form-validation";
import { FieldLabel } from "./field-label";

type SkillForkDraftFormProps = Readonly<{
  action: (formData: FormData) => Promise<void>;
  sourceLabel: string;
  buttonLabel?: string;
}>;

export function SkillForkDraftForm({
  action,
  sourceLabel,
  buttonLabel = "基于生产版新建草稿",
}: SkillForkDraftFormProps) {
  const [fieldErrors, setFieldErrors] = useState<SkillForkDraftFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateSkillForkDraftForm(formData);
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await action(formData);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={action} className="skill-fork-draft-form" onSubmit={handleSubmit} noValidate>
      <label className="form-field">
        <FieldLabel required>变更说明</FieldLabel>
        <input
          className={`field-input${fieldErrors.changeLog ? " is-invalid" : ""}`}
          name="changeLog"
          placeholder={`说明基于「${sourceLabel}」做了哪些修改`}
          aria-invalid={fieldErrors.changeLog ? "true" : "false"}
          onChange={() => {
            if (fieldErrors.changeLog) {
              setFieldErrors((current) => ({ ...current, changeLog: undefined }));
            }
          }}
        />
        {fieldErrors.changeLog ? <p className="field-error">{fieldErrors.changeLog}</p> : null}
      </label>
      <button className="button-primary" type="submit" disabled={submitting}>
        {submitting ? "创建中…" : buttonLabel}
      </button>
    </form>
  );
}
