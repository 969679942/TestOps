"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("versionId", versionId);
      await action(formData);
      setConfirmOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "发布失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="button-ghost"
        type="button"
        disabled={submitting}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        发布为生产版本
      </button>
      <ConfirmActionModal
        open={confirmOpen}
        title="确认发布生产版本"
        description={`发布后该版本将成为项目可绑定的生产规则。当前版本：${versionLabel}。`}
        confirmLabel="确认发布"
        tone="danger"
        submitting={submitting}
        error={error}
        onClose={() => {
          if (submitting) {
            return;
          }

          setConfirmOpen(false);
          setError(null);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
}
