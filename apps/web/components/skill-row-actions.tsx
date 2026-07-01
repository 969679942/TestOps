"use client";

import { useState } from "react";

import { SkillVersionCreateModal } from "./skill-version-create-modal";

type SkillRowActionsProps = Readonly<{
  primaryLabel: string;
  detailHref: string;
  form: React.ReactNode;
}>;

export function SkillRowActions({ primaryLabel, detailHref, form }: SkillRowActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="skill-row-actions">
      <a className="button-secondary" href={detailHref}>
        查看详情
      </a>
      <button className="button-ghost" type="button" onClick={() => setOpen(true)}>
        {primaryLabel}
      </button>
      <SkillVersionCreateModal open={open} onClose={() => setOpen(false)} title={primaryLabel} form={form} />
    </div>
  );
}
