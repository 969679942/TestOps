"use client";

import { useEffect, useState } from "react";

import { copy } from "../lib/copy";
import { useModalA11y } from "../lib/use-modal-a11y";

type SkillVersionCreateModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  form: React.ReactNode;
}>;

const CLOSE_MS = 220;

export function SkillVersionCreateModal({
  open,
  onClose,
  title,
  form,
}: SkillVersionCreateModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useModalA11y<HTMLDialogElement>(open && visible && !closing, onClose);

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

  return (
    <div
      className={`modal-backdrop ${closing ? "is-closing" : ""}`}
      role="presentation"
      onMouseDown={onClose}
    >
      <dialog
        open
        ref={panelRef}
        className={`modal-panel ${closing ? "is-closing" : ""}`}
        aria-modal="true"
        aria-labelledby="skill-version-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label={copy.closeModal}>
          ×
        </button>
        <div className="review-stack">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Version Draft</span>
              <h3 id="skill-version-create-title">{title}</h3>
            </div>
            <p>先保存草稿，再进入详情页继续编辑、发布或回滚。</p>
          </div>
          {form}
        </div>
      </dialog>
    </div>
  );
}
