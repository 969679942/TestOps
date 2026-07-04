"use client";

import React, { useEffect, useRef, useState } from "react";

import { copy, formatValue, type Locale } from "../lib/i18n";
import type { StructuredTextField, TestCaseRecord } from "../lib/types";
import { ConfirmActionModal } from "./confirm-action-modal";

type ReviewEditorProps = Readonly<{
  item: TestCaseRecord | null;
  locale?: Locale;
  approveAction?: (formData: FormData) => Promise<void>;
  requestChangeAction?: (formData: FormData) => Promise<void>;
  rejectAction?: (formData: FormData) => Promise<void>;
  publishAction?: (formData: FormData) => Promise<void>;
  saveAction?: (formData: FormData) => Promise<void>;
}>;

type DynamicTextListProps = Readonly<{
  addLabel: string;
  fieldNameBase: string;
  items: string[];
  kind?: "input" | "textarea";
  label: string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  prefix: string;
  removeLabel: string;
}>;

const CASE_TYPE_OPTIONS = ["functional", "negative"];
const PRIORITY_OPTIONS = ["high", "medium", "low"];
type ConfirmedReviewAction = "reject" | "publish";

const reviewConfirmationCopy: Record<
  ConfirmedReviewAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
  }
> = {
  reject: {
    title: "确认驳回用例？",
    description: "驳回后该用例将标记为已驳回，不会进入发布流程。",
    confirmLabel: "确认驳回",
  },
  publish: {
    title: "确认发布用例？",
    description: "发布后内容将锁定，并提供给下游自动化流程使用。",
    confirmLabel: "确认发布",
  },
};

function ensureEditableItems(items: string[]) {
  return items.length ? items : [""];
}

function DynamicTextList({
  addLabel,
  fieldNameBase,
  items,
  kind = "textarea",
  label,
  onChange,
  onAdd,
  onRemove,
  prefix,
  removeLabel,
}: DynamicTextListProps) {
  return (
    <section className="review-section">
      <div className="section-heading review-list-heading">
        <div>
          <span className="eyebrow">{label}</span>
          <h3>{label}</h3>
        </div>
        <button className="secondary-button" onClick={onAdd} type="button">
          {addLabel}
        </button>
      </div>

      <div className="review-stack">
        {items.map((value, index) => (
          <div className="review-list-item" key={`${fieldNameBase}-${index + 1}`}>
            <label
              className="form-field review-list-field"
              htmlFor={`${fieldNameBase}-${index + 1}`}
            >
              <span>
                {prefix} {index + 1}
              </span>
              {kind === "input" ? (
                <input
                  className="field-input"
                  id={`${fieldNameBase}-${index + 1}`}
                  name={`${fieldNameBase}-${index + 1}`}
                  onChange={(event) => onChange(index, event.target.value)}
                  value={value}
                />
              ) : (
                <textarea
                  className="field-textarea"
                  id={`${fieldNameBase}-${index + 1}`}
                  name={`${fieldNameBase}-${index + 1}`}
                  onChange={(event) => onChange(index, event.target.value)}
                  rows={3}
                  value={value}
                />
              )}
            </label>
            <button
              className="review-remove-button"
              disabled={items.length === 1}
              onClick={() => onRemove(index)}
              type="button"
            >
              {removeLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReviewEditor({
  item,
  locale = "zh",
  approveAction,
  requestChangeAction,
  rejectAction,
  publishAction,
  saveAction,
}: ReviewEditorProps) {
  const t = copy[locale].components;
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmedReviewAction | null>(null);
  const [preconditions, setPreconditions] = useState(
    ensureEditableItems(item?.preconditions ?? []),
  );
  const [steps, setSteps] = useState(
    ensureEditableItems((item?.steps ?? []).map((entry) => entry.text)),
  );
  const [expectedResults, setExpectedResults] = useState(
    ensureEditableItems((item?.expectedResults ?? []).map((entry) => entry.text)),
  );

  useEffect(() => {
    setPreconditions(ensureEditableItems(item?.preconditions ?? []));
    setSteps(ensureEditableItems((item?.steps ?? []).map((entry) => entry.text)));
    setExpectedResults(
      ensureEditableItems((item?.expectedResults ?? []).map((entry) => entry.text)),
    );
  }, [item]);

  if (!item) {
    return (
      <section className="review-empty-state">
        <span className="eyebrow">{t.reviewWorkspace}</span>
        <h3>{t.noSelection}</h3>
        <p>{t.noSelectionCopy}</p>
      </section>
    );
  }

  function submitConfirmedAction(action: ConfirmedReviewAction) {
    const targetAction = action === "reject" ? rejectAction : publishAction;
    if (!targetAction || !formRef.current) {
      setPendingConfirmation(null);
      return;
    }

    void targetAction(new FormData(formRef.current));
    setPendingConfirmation(null);
  }

  const activeConfirmation = pendingConfirmation
    ? reviewConfirmationCopy[pendingConfirmation]
    : null;
  const canPublish = item.status === "approved";

  return (
    <>
    <form action={saveAction} className="review-editor" ref={formRef}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t.reviewDraft}</span>
          <h3>{t.reviewDraftTitle}</h3>
        </div>
        <p>{t.reviewDraftCopy}</p>
      </div>

      <section className="review-meta-grid" aria-label={t.reviewMetadata}>
        <article className="review-meta-card">
          <span className="eyebrow">{t.currentStatus}</span>
          <p className="summary-value">
            <span className="status-pill">{formatValue(item.status, locale, t.draft)}</span>
          </p>
          <p>{t.statusReadonlyCopy}</p>
        </article>
        <article className="review-meta-card">
          <span className="eyebrow">{t.caseProfile}</span>
          <p className="summary-value">{formatValue(item.caseType, locale, t.case)}</p>
          <p>
            {t.priority}: {formatValue(item.priority, locale, t.unspecified)}
          </p>
        </article>
        <article className="review-meta-card">
          <span className="eyebrow">{t.automationReadiness}</span>
          <p className="summary-value">{item.automationFlag ? t.yes : t.no}</p>
          <p>{t.automationHint}</p>
        </article>
        <article className="review-meta-card">
          <span className="eyebrow">可追溯性</span>
          <p className="summary-value">{item.linkedRequirement ?? "待补充"}</p>
          <p>
            {item.sourceRefs?.length
              ? `已关联 ${item.sourceRefs.length} 条来源依据`
              : "当前用例尚未补充来源依据"}
          </p>
        </article>
      </section>

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
          <select className="field-input" defaultValue={item.caseType} name="caseType">
            {CASE_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatValue(option, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>{t.priority}</span>
          <select className="field-input" defaultValue={item.priority} name="priority">
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatValue(option, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>{t.tags}</span>
          <input
            className="field-input"
            name="tags"
            defaultValue={item.tags.join(", ")}
            placeholder={t.tagsPlaceholder}
          />
        </label>
        <label className="form-field">
          <span>关联需求</span>
          <input
            className="field-input"
            name="linkedRequirement"
            defaultValue={item.linkedRequirement ?? ""}
            placeholder="请输入需求编号、标题或规则标识"
          />
        </label>
      </div>

      {item.sourceRefs?.length ? (
        <section className="review-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">来源依据</span>
              <h3>Traceability</h3>
            </div>
            <p>该用例生成时引用的文档、规则或技能包依据。</p>
          </div>
          <div className="review-stack">
            {item.sourceRefs.map((sourceRef, index) => (
              <article className="review-meta-card" key={`source-ref-${index + 1}`}>
                <p className="summary-value">
                  {String(sourceRef.document_name ?? sourceRef.skill_name ?? sourceRef.note ?? "来源依据")}
                </p>
                <p>
                  {Object.entries(sourceRef)
                    .map(([key, value]) => `${key}: ${String(value)}`)
                    .join(" | ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <label className="inline-check review-toggle">
        <input defaultChecked={item.automationFlag} name="automationFlag" type="checkbox" />
        <span>{t.automationCandidate}</span>
      </label>

      <DynamicTextList
        addLabel={t.addPrecondition}
        fieldNameBase="precondition"
        items={preconditions}
        kind="input"
        label={t.preconditions}
        onAdd={() => setPreconditions((current) => [...current, ""])}
        onChange={(index, value) =>
          setPreconditions((current) =>
            current.map((entry, currentIndex) => (currentIndex === index ? value : entry)),
          )
        }
        onRemove={(index) =>
          setPreconditions((current) =>
            current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index),
          )
        }
        prefix={t.precondition}
        removeLabel={t.removeItem}
      />

      <DynamicTextList
        addLabel={t.addStep}
        fieldNameBase="step"
        items={steps}
        label={t.steps}
        onAdd={() => setSteps((current) => [...current, ""])}
        onChange={(index, value) =>
          setSteps((current) =>
            current.map((entry, currentIndex) => (currentIndex === index ? value : entry)),
          )
        }
        onRemove={(index) =>
          setSteps((current) =>
            current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index),
          )
        }
        prefix={t.step}
        removeLabel={t.removeItem}
      />

      <DynamicTextList
        addLabel={t.addExpectedResult}
        fieldNameBase="expected-result"
        items={expectedResults}
        label={t.expectedResults}
        onAdd={() => setExpectedResults((current) => [...current, ""])}
        onChange={(index, value) =>
          setExpectedResults((current) =>
            current.map((entry, currentIndex) => (currentIndex === index ? value : entry)),
          )
        }
        onRemove={(index) =>
          setExpectedResults((current) =>
            current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index),
          )
        }
        prefix={t.expectedResult}
        removeLabel={t.removeItem}
      />

      <label className="form-field">
        <span>{t.automationNotes}</span>
        <textarea
          className="field-textarea"
          name="automationNotes"
          defaultValue={item.automationNotes ?? ""}
          rows={4}
        />
      </label>

      <label className="form-field">
        <span>{t.reviewComment}</span>
        <textarea
          className="field-textarea"
          name="reviewComment"
          placeholder={t.reviewCommentPlaceholder}
          rows={4}
        />
      </label>

      <div className="button-row">
        <button className="primary-button" type="submit">
          {t.saveDraft}
        </button>
        <button className="secondary-button" formAction={requestChangeAction} type="submit">
          {t.requestChanges}
        </button>
        <button className="button-danger" onClick={() => setPendingConfirmation("reject")} type="button">
          {t.reject}
        </button>
        <button className="secondary-button" formAction={approveAction} type="submit">
          {t.approve}
        </button>
        {canPublish ? (
          <button className="secondary-button" onClick={() => setPendingConfirmation("publish")} type="button">
            {t.publish}
          </button>
        ) : (
          <p className="helper-text">请先批准用例，再执行发布。</p>
        )}
      </div>
    </form>
    <ConfirmActionModal
      open={pendingConfirmation !== null}
      title={activeConfirmation?.title ?? ""}
      description={activeConfirmation?.description ?? ""}
      confirmLabel={activeConfirmation?.confirmLabel ?? ""}
      tone="danger"
      onClose={() => setPendingConfirmation(null)}
      onConfirm={() => {
        if (!pendingConfirmation) {
          return;
        }

        submitConfirmedAction(pendingConfirmation);
      }}
    />
    </>
  );
}
