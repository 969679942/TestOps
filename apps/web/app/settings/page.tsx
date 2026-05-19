import React from "react";
import { AppShell } from "../../components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell currentPath="/settings">
      <section className="page-header">
        <span className="eyebrow">Settings</span>
        <h2>Project defaults and workspace preferences</h2>
        <p>
          This placeholder keeps the global shell navigation valid while settings workflows
          stay out of scope for Task 7.
        </p>
      </section>
    </AppShell>
  );
}
