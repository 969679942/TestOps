"use client";

import { useState } from "react";

import { ConfirmActionModal } from "./confirm-action-modal";

type SkillVersionRollbackActionProps = Readonly<{
  action: (formData: FormData) => Promise<void>;
  versionId: string;
  versionLabel: string;
}>;

export function SkillVersionRollbackAction({
  action,
  versionId,
  versionLabel,
}: SkillVersionRollbackActionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button className="button-secondary" type="button" onClick={() => setConfirmOpen(true)}>
        回滚为当前生产版本
      </button>
      <ConfirmActionModal
        open={confirmOpen}
        title="确认回滚生产版本？"
        description={`回滚后当前生产规则会切换到该版本。当前版本：${versionLabel}。`}
        confirmLabel="确认回滚"
        tone="danger"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          const formData = new FormData();
          formData.set("versionId", versionId);
          void action(formData);
        }}
      />
    </>
  );
}
