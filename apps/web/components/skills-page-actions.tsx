"use client";

import { useState } from "react";

import { SkillCreateModal } from "./skill-create-modal";

type SkillsPageActionsProps = Readonly<{
  createForm: React.ReactNode;
  helpContent: React.ReactNode;
}>;

export function SkillsPageActions({ createForm, helpContent }: SkillsPageActionsProps) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="skills-toolbar-actions">
      <button className="primary-button" type="button" onClick={() => setOpen(true)}>
        新建 Skill
      </button>
      <details open={helpOpen} onToggle={(event) => setHelpOpen(event.currentTarget.open)}>
        <summary className="button-secondary">{helpOpen ? "收起筛选" : "使用帮助"}</summary>
        <div className="review-stack skills-help-panel">
          {helpContent}
        </div>
      </details>
      <SkillCreateModal open={open} onClose={() => setOpen(false)} form={createForm} />
    </div>
  );
}
