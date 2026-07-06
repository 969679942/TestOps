"use client";

import { useState } from "react";

import {
  hasFieldErrors,
  validateSkillSettingsForm,
  type SkillSettingsFieldErrors,
} from "../lib/skill-form-validation";
import {
  skillCategoryOptions,
  skillDefinitionStatusOptions,
  skillDomainOptions,
  skillFieldLabels,
  skillInputTypeOptions,
} from "../lib/skill-copy";
import type { GlobalSkillDefinitionRecord } from "../lib/types";
import { FieldLabel } from "./field-label";
import { SkillTokenChipSelect } from "./skill-token-chip-select";

type SkillSettingsFormProps = Readonly<{
  skill: GlobalSkillDefinitionRecord;
  updateAction: (formData: FormData) => Promise<void>;
}>;

export function SkillSettingsForm({ skill, updateAction }: SkillSettingsFormProps) {
  const [fieldErrors, setFieldErrors] = useState<SkillSettingsFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateSkillSettingsForm(formData);
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

  return (
    <form action={updateAction} className="form-grid" onSubmit={handleSubmit} noValidate>
      <label className="form-field">
        <FieldLabel required>{skillFieldLabels.name}</FieldLabel>
        <input
          className={`field-input${fieldErrors.name ? " is-invalid" : ""}`}
          name="name"
          defaultValue={skill.name}
          aria-invalid={fieldErrors.name ? "true" : "false"}
          onChange={() => {
            if (fieldErrors.name) {
              setFieldErrors((current) => ({ ...current, name: undefined }));
            }
          }}
        />
        {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
      </label>
      <label className="form-field">
        <FieldLabel>{skillFieldLabels.category}</FieldLabel>
        <select className="field-input" name="category" defaultValue={skill.category}>
          {skillCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {!skillCategoryOptions.some((option) => option.value === skill.category) ? (
            <option value={skill.category}>{skill.category}</option>
          ) : null}
        </select>
      </label>
      <label className="form-field">
        <FieldLabel>{skillFieldLabels.domain}</FieldLabel>
        <select className="field-input" name="domain" defaultValue={skill.domain}>
          {skillDomainOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {!skillDomainOptions.some((option) => option.value === skill.domain) ? (
            <option value={skill.domain}>{skill.domain}</option>
          ) : null}
        </select>
      </label>
      <SkillTokenChipSelect
        name="inputTypes"
        label={skillFieldLabels.inputTypes}
        options={skillInputTypeOptions}
        defaultValues={skill.inputTypes}
        required
        error={fieldErrors.inputTypes}
        onSelectionChange={() => {
          if (fieldErrors.inputTypes) {
            setFieldErrors((current) => ({ ...current, inputTypes: undefined }));
          }
        }}
      />
      <label className="form-field">
        <FieldLabel>{skillFieldLabels.owner}</FieldLabel>
        <input className="field-input" name="owner" defaultValue={skill.owner} readOnly />
      </label>
      <label className="form-field">
        <FieldLabel>{skillFieldLabels.status}</FieldLabel>
        <select className="field-input" name="status" defaultValue={skill.status}>
          {skillDefinitionStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field skill-form-field-wide">
        <FieldLabel>{skillFieldLabels.description}</FieldLabel>
        <textarea className="field-input" name="description" rows={4} defaultValue={skill.description} />
      </label>
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "保存中…" : "保存设置"}
      </button>
    </form>
  );
}
