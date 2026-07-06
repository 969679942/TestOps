"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { GlobalSkillDefinitionRecord, GlobalSkillVersionRecord } from "../lib/types";
import { SkillDetailModal } from "./skill-detail-modal";
import { SkillVersionCreateForm } from "./skill-version-create-form";
import { SkillVersionCreateModal } from "./skill-version-create-modal";

type SkillRowActionsProps = Readonly<{
  primaryLabel: string;
  detailHref: string;
  editHref: string;
  skill: GlobalSkillDefinitionRecord;
  productionVersion: GlobalSkillVersionRecord | null;
  skillId: string;
  createVersionAction: (formData: FormData) => Promise<void>;
}>;

export function SkillRowActions({
  primaryLabel,
  detailHref,
  editHref,
  skill,
  productionVersion,
  skillId,
  createVersionAction,
}: SkillRowActionsProps) {
  const router = useRouter();
  const [detailOpen, setDetailOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  async function handleCreateVersion(formData: FormData) {
    await createVersionAction(formData);
    router.refresh();
  }

  return (
    <div className="skill-row-actions">
      <a className="button-secondary" href={editHref}>
        编辑
      </a>
      <button className="button-ghost" type="button" onClick={() => setDetailOpen(true)}>
        预览
      </button>
      <button className="button-ghost" type="button" onClick={() => setVersionOpen(true)}>
        {primaryLabel}
      </button>
      <SkillDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        skill={skill}
        version={productionVersion}
        editHref={editHref}
      />
      <SkillVersionCreateModal
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        title={primaryLabel}
        form={
          <SkillVersionCreateForm
            skillId={skillId}
            productionVersion={productionVersion}
            createAction={handleCreateVersion}
            onSuccess={() => {
              setVersionOpen(false);
              router.refresh();
            }}
          />
        }
      />
    </div>
  );
}
