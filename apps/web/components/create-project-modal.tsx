"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { copy } from "../lib/copy";
import { useModalA11y } from "../lib/use-modal-a11y";
import { CreateProjectForm } from "./create-project-form";

type CreateProjectModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const CLOSE_MS = 220;

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useModalA11y(open && visible && !closing, onClose);

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

  if (!visible) {
    return null;
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    onClose();
  }

  return (
    <div
      className={`modal-backdrop ${closing ? "is-closing" : ""}`}
      role="presentation"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className={`modal-panel ${closing ? "is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={handleClose} aria-label={copy.closeModal}>
          ×
        </button>
        <CreateProjectForm
          onSubmittingChange={setSubmitting}
          onSuccess={() => {
            handleClose();
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
