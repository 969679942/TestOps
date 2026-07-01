"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { updateRuntimeSettings } from "../lib/api";
import type { RuntimeSettingsRecord, RuntimeSettingsUpdateRecord } from "../lib/types";

type SettingsEditorProps = Readonly<{
  settings: RuntimeSettingsRecord;
}>;

function toEditableSettings(settings: RuntimeSettingsRecord): RuntimeSettingsUpdateRecord {
  return {
    cursor: { ...settings.cursor },
    codex: { ...settings.codex },
    runner: { ...settings.runner },
    storage: { ...settings.storage },
  };
}

export function SettingsEditor({ settings }: SettingsEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<RuntimeSettingsUpdateRecord>(() =>
    toEditableSettings(settings),
  );
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toEditableSettings(settings));
  }, [settings]);

  useEffect(() => {
    if (!toast && !error) return undefined;
    const timer = window.setTimeout(() => {
      setToast(null);
      setError(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [toast, error]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setToast(null);
    setError(null);

    const result = await updateRuntimeSettings(draft);
    if (result.kind !== "success") {
      setError(result.kind === "http-error" ? `保存失败（${result.status}）` : "当前 API 不可用，未能保存配置。");
      setBusy(false);
      return;
    }

    setDraft(toEditableSettings(result.settings));
    setToast("系统配置已保存。");
    setBusy(false);
    router.refresh();
  }

  return (
    <form className="settings-grid" onSubmit={handleSubmit}>
      {toast ? <div className="toast toast-success">{toast}</div> : null}
      {error ? <div className="toast toast-error">{error}</div> : null}

      <article className="data-card settings-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Runtime</span>
            <h3>Cursor / Codex</h3>
          </div>
          <p>配置生成用例、失败分析时依赖的核心 AI 运行入口。</p>
        </div>
        <div className="meta-grid">
          <label className="field">
            <span>Cursor Command</span>
            <input
              value={draft.cursor.command}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  cursor: { ...current.cursor, command: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Timeout (s)</span>
            <input
              type="number"
              min={1}
              value={draft.cursor.timeoutSeconds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  cursor: {
                    ...current.cursor,
                    timeoutSeconds: Number(event.target.value || 1),
                  },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Working Directory</span>
            <input
              value={draft.cursor.cwd ?? ""}
              placeholder="留空则沿用当前进程目录"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  cursor: {
                    ...current.cursor,
                    cwd: event.target.value.trim() || null,
                  },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Failure Analysis Model</span>
            <input
              value={draft.codex.failureAnalysisModel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  codex: {
                    ...current.codex,
                    failureAnalysisModel: event.target.value,
                  },
                }))
              }
            />
          </label>
        </div>
      </article>

      <article className="data-card settings-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Runner</span>
            <h3>默认执行器</h3>
          </div>
          <p>统一脚本生成、执行和报告时使用的默认框架配置。</p>
        </div>
        <div className="meta-grid">
          <label className="field">
            <span>Framework</span>
            <input
              value={draft.runner.framework}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  runner: { ...current.runner, framework: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Language</span>
            <input
              value={draft.runner.language}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  runner: { ...current.runner, language: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Pattern</span>
            <input
              value={draft.runner.pattern}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  runner: { ...current.runner, pattern: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Reporter</span>
            <input
              value={draft.runner.reporter}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  runner: { ...current.runner, reporter: event.target.value },
                }))
              }
            />
          </label>
        </div>
      </article>

      <article className="data-card settings-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Storage</span>
            <h3>存储根路径</h3>
          </div>
          <p>管理文档上传产物和自动化产物的默认落盘位置。</p>
        </div>
        <div className="meta-grid">
          <label className="field">
            <span>Artifact Root</span>
            <input
              value={draft.storage.artifactRoot}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  storage: { ...current.storage, artifactRoot: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Document Root</span>
            <input
              value={draft.storage.documentRoot}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  storage: { ...current.storage, documentRoot: event.target.value },
                }))
              }
            />
          </label>
        </div>
      </article>

      <article className="data-card settings-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Notifications</span>
            <h3>Lark</h3>
          </div>
          <p>Webhook 仍保持安全只读展示，避免在页面上暴露敏感地址。</p>
        </div>
        <dl className="settings-detail-list">
          <div>
            <dt>Webhook</dt>
            <dd>{settings.notifications.larkWebhookConfigured ? "已配置" : "未配置"}</dd>
          </div>
          <div>
            <dt>投递位置</dt>
            <dd>Lark 群消息</dd>
          </div>
        </dl>
      </article>

      <div className="button-row">
        <button className="button-primary" type="submit" disabled={busy}>
          {busy ? "保存中…" : "保存配置"}
        </button>
      </div>
    </form>
  );
}
