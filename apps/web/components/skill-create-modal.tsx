"use client";

import { useEffect, useState } from "react";

import { copy } from "../lib/copy";
import { useModalA11y } from "../lib/use-modal-a11y";

type SkillCreateModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  form: React.ReactNode;
}>;

const CLOSE_MS = 220;

export function SkillCreateModal({ open, onClose, form }: SkillCreateModalProps) {
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

  function handleClose() {
    onClose();
  }

  return (
    <div
      className={`modal-backdrop ${closing ? "is-closing" : ""}`}
      role="presentation"
      onMouseDown={handleClose}
    >
      <dialog
        open
        ref={panelRef}
        className={`modal-panel ${closing ? "is-closing" : ""}`}
        aria-modal="true"
        aria-labelledby="skill-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={handleClose} aria-label={copy.closeModal}>
          ×
        </button>
        <div className="review-stack">
          <div className="section-heading">
            <div>
              <span className="eyebrow">快速操作</span>
              <h3 id="skill-create-title">新建 Skill</h3>
            </div>
            <p>填写提示词与证据策略即可创建，创建后直接进入内容编辑。</p>
          </div>
          {form}
        </div>
      </dialog>
    </div>
  );
}
