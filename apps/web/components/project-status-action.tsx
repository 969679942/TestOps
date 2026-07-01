"use client";

import { useState } from "react";

import { copy } from "../lib/copy";
import { ConfirmActionModal } from "./confirm-action-modal";
import {
  ApiError,
  type ProjectStatus,
  updateProjectStatus,
} from "../lib/workspace-api";

type ProjectStatusActionProps = Readonly<{
  projectId: string;
  status: ProjectStatus;
  onUpdated?: (status: ProjectStatus) => void;
  className?: string;
}>;

export function ProjectStatusAction({
  projectId,
  status,
  onUpdated,
  className,
}: ProjectStatusActionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus: ProjectStatus = status === "archived" ? "active" : "archived";
  const confirmationTitle = nextStatus === "archived" ? copy.archiveProject : copy.restoreProject;
  const confirmationDescription =
    nextStatus === "archived"
      ? `${copy.archiveProjectConfirm}${copy.archiveProjectImpact}`
      : `${copy.restoreProjectConfirm}${copy.restoreProjectImpact}`;
  const confirmationButtonLabel =
    nextStatus === "archived" ? copy.confirmArchiveProject : copy.confirmRestoreProject;

  async function handleClick() {
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateProjectStatus(projectId, nextStatus);
      setConfirmOpen(false);
      if (onUpdated) {
        onUpdated(updated.status as ProjectStatus);
        return;
      }

      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : copy.updateProjectStatusFailed);
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
        onClick={handleClick}
      >
        {status === "archived" ? copy.restoreProject : copy.archiveProject}
      </button>
      <ConfirmActionModal
        open={confirmOpen}
        title={confirmationTitle}
        description={confirmationDescription}
        confirmLabel={confirmationButtonLabel}
        tone={nextStatus === "archived" ? "danger" : "primary"}
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
