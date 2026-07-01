"use client";

import { useState } from "react";

import { copy } from "../lib/copy";
import { ApiError, deleteProject } from "../lib/workspace-api";
import { ConfirmActionModal } from "./confirm-action-modal";

type ProjectDeleteActionProps = Readonly<{
  projectId: string;
  onDeleted?: () => void;
  className?: string;
}>;

export function ProjectDeleteAction({
  projectId,
  onDeleted,
  className,
}: ProjectDeleteActionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteProject(projectId);
      setConfirmOpen(false);
      if (onDeleted) {
        onDeleted();
        return;
      }

      window.location.href = "/";
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : copy.deleteProjectFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className={className ?? "button-secondary"}
        type="button"
        disabled={submitting}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        {copy.deleteProject}
      </button>
      <ConfirmActionModal
        open={confirmOpen}
        title={copy.deleteProject}
        description={`${copy.deleteProjectConfirm} ${copy.deleteProjectImpact}`}
        confirmLabel={copy.confirmDeleteProject}
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
