import React from "react";
import { AppShell } from "../../components/app-shell";
import { copy, normalizeLocale, type LocaleSearchParams } from "../../lib/i18n";

type SettingsPageProps = Readonly<{
  searchParams?: Promise<LocaleSearchParams>;
}>;

export default async function SettingsPage({ searchParams }: SettingsPageProps = {}) {
  const locale = normalizeLocale((await searchParams)?.lang);
  const t = copy[locale].settings;

  return (
    <AppShell currentPath="/settings" locale={locale}>
      <section className="page-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2>{t.title}</h2>
        <p>{t.description}</p>
      </section>
    </AppShell>
  );
}
