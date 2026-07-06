"use client";

import { useState } from "react";

type GenerationCreateFormProps = Readonly<{
  action: (formData: FormData) => Promise<void>;
  canSubmit: boolean;
  disabledReason?: string | null;
  children: React.ReactNode;
  submitLabel: string;
}>;

export function GenerationCreateForm({
  action,
  canSubmit,
  disabledReason,
  children,
  submitLabel,
  hideSubmit = false,
}: GenerationCreateFormProps & { hideSubmit?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "创建生成任务失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-stack generation-create-form" onSubmit={handleSubmit} noValidate>
      {error ? <p className="field-error">{error}</p> : null}
      {children}
      {disabledReason ? <p className="helper-text">{disabledReason}</p> : null}
      {hideSubmit ? null : (
        <button className="primary-button" type="submit" disabled={!canSubmit || submitting}>
          {submitting ? "提交中…" : submitLabel}
        </button>
      )}
    </form>
  );
}
