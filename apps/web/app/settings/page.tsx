import React from "react";
import { AppShell } from "../../components/app-shell";
import { getRuntimeSettings } from "../../lib/api";
import { copy, normalizeLocale, type LocaleSearchParams } from "../../lib/i18n";

type SettingsPageProps = Readonly<{
  searchParams?: Promise<LocaleSearchParams>;
}>;

export default async function SettingsPage({ searchParams }: SettingsPageProps = {}) {
  const locale = normalizeLocale((await searchParams)?.lang);
  const pageText = copy[locale].settings;
  const settingsResult = await getRuntimeSettings();
  const runtimeSettings =
    settingsResult.kind === "http-error" ? null : settingsResult.settings;

  return (
    <AppShell currentPath="/settings" locale={locale} contentWidth="wide">
      <section className="page-header">
        <span className="eyebrow">{pageText.eyebrow}</span>
        <h2>{pageText.title}</h2>
        <p>{pageText.description}</p>
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

          <section className="settings-grid" aria-label={pageText.title}>
            <article className="data-card settings-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{pageText.runtime}</span>
                  <h3>{pageText.cursorCodex}</h3>
                </div>
                <p>
                  {pageText.failureModel}: {runtimeSettings.codex.failureAnalysisModel}
                </p>
              </div>
              <dl className="settings-detail-list">
                <div>
                  <dt>{pageText.cursorCommand}</dt>
                  <dd>{runtimeSettings.cursor.command}</dd>
                </div>
                <div>
                  <dt>{pageText.timeout}</dt>
                  <dd>{runtimeSettings.cursor.timeoutSeconds}s</dd>
                </div>
                <div>
                  <dt>{pageText.workingDirectory}</dt>
                  <dd>{runtimeSettings.cursor.cwd ?? pageText.defaultDirectory}</dd>
                </div>
              </dl>
            </article>

            <article className="data-card settings-card">
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
              <dl className="settings-detail-list">
                <div>
                  <dt>Webhook</dt>
                  <dd>
                    {runtimeSettings.notifications.larkWebhookConfigured
                      ? pageText.configured
                      : pageText.notConfigured}
                  </dd>
                </div>
                <div>
                  <dt>投递位置</dt>
                  <dd>Lark 群消息</dd>
                </div>
              </dl>
            </article>

            <article className="data-card settings-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{pageText.runnerDefaults}</span>
                  <h3>Playwright + TypeScript + POM</h3>
                </div>
                <p>统一执行器默认值，供后续自动化生成、执行和报告链路复用。</p>
              </div>
              <dl className="settings-detail-list">
                <div>
                  <dt>框架</dt>
                  <dd>{runtimeSettings.runner.framework}</dd>
                </div>
                <div>
                  <dt>语言</dt>
                  <dd>{runtimeSettings.runner.language}</dd>
                </div>
                <div>
                  <dt>模式</dt>
                  <dd>{runtimeSettings.runner.pattern}</dd>
                </div>
                <div>
                  <dt>报告器</dt>
                  <dd>{runtimeSettings.runner.reporter}</dd>
                </div>
              </dl>
            </article>
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
