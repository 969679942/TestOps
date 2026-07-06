"use client";

import { useState } from "react";

type PopconfirmButtonProps = Readonly<{
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
}>;

export function PopconfirmButton({
  label,
  title,
  description,
  confirmLabel = "确定",
  cancelLabel = "取消",
  tone = "danger",
  disabled = false,
  onConfirm,
}: PopconfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <span className="popconfirm-anchor">
      <button
        className={tone === "danger" ? "button-ghost button-ghost-danger" : "button-ghost"}
        disabled={disabled}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <span className="popconfirm-panel" role="dialog" aria-label={title}>
          <strong>{title}</strong>
          <p>{description}</p>
          <span className="popconfirm-actions">
            <button
              className="button-secondary"
              disabled={submitting}
              type="button"
              onClick={() => setOpen(false)}
            >
              {cancelLabel}
            </button>
            <button
              className={tone === "danger" ? "button-danger" : "button-primary"}
              disabled={submitting}
              type="button"
              onClick={() => void handleConfirm()}
            >
              {submitting ? `${confirmLabel}…` : confirmLabel}
            </button>
          </span>
        </span>
      ) : null}
    </span>
  );
}
