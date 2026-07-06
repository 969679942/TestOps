"use client";

import { useState } from "react";

import { SkillCreateForm } from "./skill-create-form";
import { SkillCreateModal } from "./skill-create-modal";
import { SkillImportModal } from "./skill-import-modal";
import { SkillImportPanel } from "./skill-import-panel";

type SkillsPageActionsProps = Readonly<{
  createAction: (formData: FormData) => Promise<void>;
  importAction: (formData: FormData) => Promise<void>;
}>;

export function SkillsPageActions({ createAction, importAction }: SkillsPageActionsProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="skills-toolbar-actions">
      <button className="button-secondary" type="button" onClick={() => setImportOpen(true)}>
        导入 Skill
      </button>
      <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>
        新建 Skill
      </button>
      <SkillImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        form={
          <SkillImportPanel
            importAction={importAction}
            onSuccess={() => setImportOpen(false)}
          />
        }
      />
      <SkillCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        form={<SkillCreateForm createAction={createAction} onSuccess={() => setCreateOpen(false)} />}
      />
    </div>
  );
}
