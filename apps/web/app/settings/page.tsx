import React from "react";
import { AppShell } from "../../components/app-shell";
import { SettingsEditor } from "../../components/settings-editor";
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
              <p className="summary-value">
                {runtimeSettings.runner.framework} + {runtimeSettings.runner.language}
              </p>
            </article>
            <article className="summary-card">
              <span className="eyebrow">Storage</span>
              <p className="summary-value">{runtimeSettings.storage.artifactRoot}</p>
            </article>
          </section>

          <SettingsEditor settings={runtimeSettings} />
        </>
      ) : (
        <section>
          <p>{pageText.unavailable}</p>
        </section>
      )}
    </AppShell>
  );
}
