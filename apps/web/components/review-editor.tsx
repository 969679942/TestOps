import React from "react";

import type { StructuredTextField, TestCaseRecord } from "../lib/types";

type ReviewEditorProps = Readonly<{
  item: TestCaseRecord | null;
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

export function ReviewEditor({ item }: ReviewEditorProps) {
  if (!item) {
    return (
      <section className="review-empty-state">
        <span className="eyebrow">Review Workspace</span>
        <h3>No test case selected</h3>
        <p>Choose a draft from the review queue to inspect steps, expected results, and notes.</p>
      </section>
    );
  }

  return (
    <section className="review-editor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Review Draft</span>
          <h3>Review draft</h3>
        </div>
        <p>Adjust case details before approval so the published version stays traceable.</p>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Title</span>
          <input className="field-input" name="title" defaultValue={item.title} />
        </label>
        <label className="form-field">
          <span>Module</span>
          <input className="field-input" name="module" defaultValue={item.module} />
        </label>
        <label className="form-field">
          <span>Feature</span>
          <input className="field-input" name="feature" defaultValue={item.feature} />
        </label>
        <label className="form-field">
          <span>Case Type</span>
          <input className="field-input" name="caseType" defaultValue={item.caseType} />
        </label>
        <label className="form-field">
          <span>Priority</span>
          <input className="field-input" name="priority" defaultValue={item.priority} />
        </label>
        <label className="form-field">
          <span>Status</span>
          <input className="field-input" name="status" defaultValue={item.status} />
        </label>
      </div>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Preconditions</span>
            <h3>Preconditions</h3>
          </div>
        </div>

        <div className="review-stack">
          {item.preconditions.map((value, index) => (
            <label key={`precondition-${index + 1}`} className="form-field">
              <span>Precondition {index + 1}</span>
              <input
                className="field-input"
                name={`precondition-${index + 1}`}
                defaultValue={value}
              />
            </label>
          ))}
        </div>
      </section>

      <TextFieldList items={item.steps} label="Steps" prefix="Step" />
      <TextFieldList
        items={item.expectedResults}
        label="Expected Results"
        prefix="Expected result"
      />

      <div className="form-grid">
        <label className="form-field">
          <span>Tags</span>
          <input className="field-input" name="tags" defaultValue={item.tags.join(", ")} />
        </label>
        <label className="form-field">
          <span>Automation Candidate</span>
          <input
            className="field-input"
            name="automationFlag"
            defaultValue={item.automationFlag ? "Yes" : "No"}
          />
        </label>
      </div>

      <label className="form-field">
        <span>Automation Notes</span>
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
