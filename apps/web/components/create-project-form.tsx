"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, createProject } from "../lib/workspace-api";
import { copy } from "../lib/copy";
import { slugifyProjectCode } from "../lib/slug";

type CreateProjectFormProps = Readonly<{
  onSuccess?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}>;

export function CreateProjectForm({ onSuccess, onSubmittingChange }: CreateProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!codeTouched) {
      setCode(slugifyProjectCode(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    onSubmittingChange?.(true);

    try {
      const project = await createProject({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
      });
      onSuccess?.();
      router.push(`/projects/${project.id}`);
      router.refresh();
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
          placeholder="支付平台"
        />
      </label>

      <label className="field">
        <span>{copy.projectCode}</span>
        <input
          required
          value={code}
          onChange={(event) => {
            setCodeTouched(true);
            setCode(event.target.value);
          }}
          placeholder="payments-platform"
        />
      </label>

      <label className="field">
        <span>{copy.description}</span>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="结账、退款与结算相关流程"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button-primary wide" type="submit" disabled={submitting}>
        {submitting ? "创建中…" : copy.createProject}
      </button>
    </form>
  );
}
