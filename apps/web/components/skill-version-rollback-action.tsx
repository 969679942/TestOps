"use client";

import { useRouter } from "next/navigation";
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
      setError(submitError instanceof Error ? submitError.message : "回滚失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="button-secondary"
        type="button"
        disabled={submitting}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        回滚为当前生产版本
      </button>
      <ConfirmActionModal
        open={confirmOpen}
        title="确认回滚生产版本？"
        description={`回滚后当前生产规则会切换到该版本。当前版本：${versionLabel}。`}
        confirmLabel="确认回滚"
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
