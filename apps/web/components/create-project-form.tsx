"use client";
import { useState } from "react";

import { ApiError, createProject, type ProjectRecord } from "../lib/workspace-api";
import { copy } from "../lib/copy";
import { slugifyProjectCode } from "../lib/slug";

type CreateProjectFormProps = Readonly<{
  onSuccess?: (project: ProjectRecord) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}>;

export function CreateProjectForm({ onSuccess, onSubmittingChange }: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    onSubmittingChange?.(true);

    try {
      const project = await createProject({
        name: name.trim(),
        code: slugifyProjectCode(name),
        description: description.trim() || undefined,
      });
      onSuccess?.(project);
    } catch (submitError) {
      const message =
        submitError instanceof ApiError
          ? submitError.message
          : copy.createFailed;
      setError(message);
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit} aria-label="创建项目">
      <div className="form-header">
        <span className="eyebrow">{copy.newProject}</span>
        <h3 id="create-project-title">{copy.createProject}</h3>
        <p>{copy.createProjectHint}</p>
      </div>

      <label className="field">
        <span>{copy.projectName}</span>
        <input
          required
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder=""
        />
      </label>

      <label className="field">
        <span>{copy.description}</span>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder=""
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button-primary wide" type="submit" disabled={submitting}>
        {submitting ? "创建中…" : copy.createProject}
      </button>
    </form>
  );
}
