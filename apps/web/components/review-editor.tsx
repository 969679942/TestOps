import React from "react";

import { copy, type Locale } from "../lib/i18n";
import type { StructuredTextField, TestCaseRecord } from "../lib/types";

type ReviewEditorProps = Readonly<{
  item: TestCaseRecord | null;
  locale?: Locale;
}>;

type TextFieldListProps = Readonly<{
  items: StructuredTextField[];
  label: string;
  prefix: string;
}>;

function toFieldName(prefix: string, index: number) {
  return `${prefix.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`;
}

function TextFieldList({ items, label, prefix }: TextFieldListProps) {
  return (
    <section className="review-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{label}</span>
          <h3>{label}</h3>
        </div>
      </div>

      <div className="review-stack">
        {items.map((item, index) => (
          <label key={`${prefix}-${index + 1}`} className="form-field">
            <span>{prefix} {index + 1}</span>
            <textarea
              className="field-textarea"
              name={toFieldName(prefix, index)}
              defaultValue={item.text}
              rows={3}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export function ReviewEditor({ item, locale = "en" }: ReviewEditorProps) {
  const t = copy[locale].components;

  if (!item) {
    return (
      <section className="review-empty-state">
        <span className="eyebrow">{t.reviewWorkspace}</span>
        <h3>{t.noSelection}</h3>
        <p>{t.noSelectionCopy}</p>
      </section>
    );
  }

  return (
    <section className="review-editor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t.reviewDraft}</span>
          <h3>{t.reviewDraftTitle}</h3>
        </div>
        <p>{t.reviewDraftCopy}</p>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>{t.title}</span>
          <input className="field-input" name="title" defaultValue={item.title} />
        </label>
        <label className="form-field">
          <span>{t.module}</span>
          <input className="field-input" name="module" defaultValue={item.module} />
        </label>
        <label className="form-field">
          <span>{t.feature}</span>
          <input className="field-input" name="feature" defaultValue={item.feature} />
        </label>
        <label className="form-field">
          <span>{t.caseType}</span>
          <input className="field-input" name="caseType" defaultValue={item.caseType} />
        </label>
        <label className="form-field">
          <span>{t.priority}</span>
          <input className="field-input" name="priority" defaultValue={item.priority} />
        </label>
        <label className="form-field">
          <span>{t.status}</span>
          <input className="field-input" name="status" defaultValue={item.status} />
        </label>
      </div>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.preconditions}</span>
            <h3>{t.preconditions}</h3>
          </div>
        </div>

        <div className="review-stack">
          {item.preconditions.map((value, index) => (
            <label key={`precondition-${index + 1}`} className="form-field">
              <span>{t.precondition} {index + 1}</span>
              <input
                className="field-input"
                name={`precondition-${index + 1}`}
                defaultValue={value}
              />
            </label>
          ))}
        </div>
      </section>

      <TextFieldList items={item.steps} label={t.steps} prefix={t.step} />
      <TextFieldList
        items={item.expectedResults}
        label={t.expectedResults}
        prefix={t.expectedResult}
      />

      <div className="form-grid">
        <label className="form-field">
          <span>{t.tags}</span>
          <input className="field-input" name="tags" defaultValue={item.tags.join(", ")} />
        </label>
        <label className="form-field">
          <span>{t.automationCandidate}</span>
          <input
            className="field-input"
            name="automationFlag"
            defaultValue={item.automationFlag ? t.yes : t.no}
          />
        </label>
      </div>

      <label className="form-field">
        <span>{t.automationNotes}</span>
        <textarea
          className="field-textarea"
          name="automationNotes"
          defaultValue={item.automationNotes ?? ""}
          rows={4}
        />
      </label>
    </section>
  );
}
