"use client";

import { useState } from "react";

import { ConfirmActionModal } from "./confirm-action-modal";

type SkillVersionPublishActionProps = Readonly<{
  action: (formData: FormData) => Promise<void>;
  versionId: string;
  versionLabel: string;
}>;

export function SkillVersionPublishAction({
  action,
  versionId,
  versionLabel,
}: SkillVersionPublishActionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button className="button-ghost" type="button" onClick={() => setConfirmOpen(true)}>
        发布为生产版本
      </button>
      <ConfirmActionModal
        open={confirmOpen}
        title="确认发布生产版本"
        description={`发布后该版本将成为项目可绑定的生产规则。当前版本：${versionLabel}。`}
        confirmLabel="确认发布"
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
