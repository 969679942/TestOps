"use client";

import { useState } from "react";

import { copy } from "../lib/copy";
import {
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

  async function handleClick() {
    const nextStatus: ProjectStatus = status === "archived" ? "active" : "archived";
    const confirmed = window.confirm(
      nextStatus === "archived"
        ? copy.archiveProjectConfirm
        : copy.restoreProjectConfirm,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateProjectStatus(projectId, nextStatus);
      if (onUpdated) {
        onUpdated(updated.status as ProjectStatus);
        return;
      }

      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      className={className ?? "button-secondary"}
      type="button"
      disabled={submitting}
      onClick={handleClick}
    >
      {status === "archived" ? copy.restoreProject : copy.archiveProject}
    </button>
  );
}
