import React from "react";
import { AppShell } from "../../components/app-shell";
import { getRuntimeSettings } from "../../lib/api";
import { copy, normalizeLocale, type LocaleSearchParams } from "../../lib/i18n";

type SettingsPageProps = Readonly<{
  searchParams?: Promise<LocaleSearchParams>;
}>;

export default async function SettingsPage({ searchParams }: SettingsPageProps = {}) {
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale].settings;
  const settingsResult = await getRuntimeSettings();
  const runtimeSettings =
    settingsResult.kind === "http-error" ? null : settingsResult.settings;
  const pageText =
    locale === "zh"
      ? {
          runtime: "运行配置",
          cursorCodex: "Cursor/Codex",
          cursorCommand: "Cursor 命令",
          timeout: "超时",
          workingDirectory: "工作目录",
          failureModel: "失败分析模型",
          notifications: "通知",
          lark: "Lark",
          configured: "Configured",
          notConfigured: "Not configured",
          runnerDefaults: "Runner 默认参数",
          unavailable: "设置暂时不可用，API 返回了错误。",
        }
      : {
          runtime: "Runtime configuration",
          cursorCodex: "Cursor/Codex",
          cursorCommand: "Cursor command",
          timeout: "Timeout",
          workingDirectory: "Working directory",
          failureModel: "Failure analysis model",
          notifications: "Notifications",
          lark: "Lark",
          configured: "Configured",
          notConfigured: "Not configured",
          runnerDefaults: "Runner defaults",
          unavailable: "Settings are temporarily unavailable because the API returned an error.",
        };

  return (
    <AppShell currentPath="/settings" locale={locale}>
      <section className="page-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2>{t.title}</h2>
        <p>{t.description}</p>
      </section>

      {runtimeSettings ? (
        <>
          <section className="summary-grid" aria-label={pageText.runtime}>
            <article className="summary-card">
              <span className="eyebrow">{pageText.cursorCodex}</span>
              <p className="summary-value">{runtimeSettings.cursor.command}</p>
            </article>
            <article className="summary-card">
              <span className="eyebrow">{pageText.notifications}</span>
              <p className="summary-value">
                {runtimeSettings.notifications.larkWebhookConfigured
                  ? pageText.configured
                  : pageText.notConfigured}
              </p>
            </article>
            <article className="summary-card">
              <span className="eyebrow">{pageText.runnerDefaults}</span>
              <p className="summary-value">Playwright + TypeScript + POM</p>
            </article>
          </section>

          <section className="data-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{pageText.runtime}</span>
                <h3>{pageText.cursorCodex}</h3>
              </div>
              <p>{pageText.failureModel}: {runtimeSettings.codex.failureAnalysisModel}</p>
            </div>
            <div className="table-detail">
              <p>{pageText.cursorCommand}: {runtimeSettings.cursor.command}</p>
              <p>{pageText.timeout}: {runtimeSettings.cursor.timeoutSeconds}s</p>
              <p>
                {pageText.workingDirectory}: {runtimeSettings.cursor.cwd ?? "default"}
              </p>
            </div>
          </section>

          <section className="data-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{pageText.notifications}</span>
                <h3>{pageText.lark}</h3>
              </div>
              <p>
                {runtimeSettings.notifications.larkWebhookConfigured
                  ? pageText.configured
                  : pageText.notConfigured}
              </p>
            </div>
          </section>

          <section className="data-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{pageText.runnerDefaults}</span>
                <h3>Playwright + TypeScript + POM</h3>
              </div>
              <p>
                {runtimeSettings.runner.framework} / {runtimeSettings.runner.language} /{" "}
                {runtimeSettings.runner.reporter}
              </p>
            </div>
          </section>
        </>
      ) : (
        <section>
          <p>{pageText.unavailable}</p>
        </section>
      )}
    </AppShell>
  );
}
