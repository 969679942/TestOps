"use client";

import { useEffect, useState } from "react";

import { copy } from "../lib/copy";
import { useModalA11y } from "../lib/use-modal-a11y";
import type { GlobalSkillDefinitionRecord, GlobalSkillVersionRecord } from "../lib/types";
import { SkillDetailContent } from "./skill-detail-content";

type SkillDetailModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  skill: GlobalSkillDefinitionRecord | null;
  version: GlobalSkillVersionRecord | null;
  editHref: string;
}>;

const CLOSE_MS = 220;

export function SkillDetailModal({
  open,
  onClose,
  skill,
  version,
  editHref,
}: SkillDetailModalProps) {
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

  if (!visible || !skill) {
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
        className={`modal-panel skill-detail-modal ${closing ? "is-closing" : ""}`}
        aria-modal="true"
        aria-labelledby="skill-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={handleClose} aria-label={copy.closeModal}>
          ×
        </button>
        <div className="skill-detail-modal-body">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Skill 详情</span>
              <h3 id="skill-detail-title">{skill.name}</h3>
            </div>
            <p>聚焦提示词与证据策略，目录信息仅在必要时展示。</p>
          </div>
          <SkillDetailContent skill={skill} version={version} />
        </div>
        <div className="skill-detail-modal-footer">
          <button className="button-secondary" type="button" onClick={handleClose}>
            关闭
          </button>
          <a className="button-primary" href={editHref}>
            编辑内容
          </a>
        </div>
      </dialog>
    </div>
  );
}
