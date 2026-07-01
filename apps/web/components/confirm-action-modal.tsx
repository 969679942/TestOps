"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { copy } from "../lib/copy";
import { useModalA11y } from "../lib/use-modal-a11y";

type ConfirmActionModalProps = Readonly<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}>;

const CLOSE_MS = 180;

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = copy.cancelAction,
  tone = "primary",
  submitting = false,
  error = null,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useModalA11y<HTMLDialogElement>(open && visible && !closing, onClose);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      document.body.classList.add("modal-open");
      return;
    }

    if (!visible) {
      return;
    }

    setClosing(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
      document.body.classList.remove("modal-open");
    }, CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [open, visible]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    onClose();
  }

  const confirmClassName = tone === "danger" ? "button-danger" : "button-primary";

  return createPortal(
    <div
      className={`modal-backdrop ${closing ? "is-closing" : ""}`}
      role="presentation"
      onMouseDown={handleClose}
    >
      <dialog
        open
        ref={panelRef}
        className={`modal-panel project-status-modal ${closing ? "is-closing" : ""}`}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="project-status-modal-copy">
          <div className="project-status-modal-title-row">
            <span
              className={`project-status-modal-icon ${tone === "danger" ? "is-danger" : "is-primary"}`}
              aria-hidden="true"
            >
              !
            </span>
            <h3 id={titleId}>{title}</h3>
          </div>
          <p id={descriptionId}>{description}</p>
        </div>
        {error ? <p className="form-error project-status-modal-error">{error}</p> : null}
        <div className="project-status-modal-actions">
          <button className="button-secondary" type="button" onClick={handleClose} disabled={submitting}>
            {cancelLabel}
          </button>
          <button className={confirmClassName} type="button" onClick={() => void onConfirm()} disabled={submitting}>
            {submitting ? `${confirmLabel}...` : confirmLabel}
          </button>
        </div>
      </dialog>
    </div>,
    document.body,
  );
}
