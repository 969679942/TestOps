import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../components/app-shell";

describe("AppShell", () => {
  it("renders global navigation links", () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(html).toContain('href="/"');
    expect(html).toContain(">项目<");
  });

  it("renders Chinese navigation and a matching language switch link", () => {
    const html = renderToStaticMarkup(
      <AppShell currentPath="/projects/payments" locale="zh">
        <div>content</div>
      </AppShell>,
    );

    expect(html).toContain(">项目<");
    expect(html).toContain(">设置<");
    expect(html).toContain(">英文<");
    expect(html).toContain('href="/projects/payments?lang=en"');
  });

  it("renders the Task 9 project navigation links when a project is present", () => {
    const html = renderToStaticMarkup(
      <AppShell
        currentPath="/projects/payments/review"
        project={{
          id: "payments",
          name: "Payments Platform",
          code: "payments",
          description: "Checkout flows.",
          status: "active",
          defaultProvider: "cursor",
          defaultPromptProfile: "default",
        }}
      >
        <div>content</div>
      </AppShell>,
    );

    expect(html).toContain('href="/projects/payments/test-cases"');
    expect(html).toContain(">Test Cases<");
    expect(html).toContain('href="/projects/payments/review"');
    expect(html).toContain(">Review<");
    expect(html).toContain('aria-current="page"');
  });
});
