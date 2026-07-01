import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../components/app-shell";

describe("AppShell", () => {
  it("renders Chinese global navigation links only", () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(html).toContain('href="/"');
    expect(html).toContain(">项目<");
    expect(html).toContain('href="/skills"');
    expect(html).toContain(">Skills<");
    expect(html).toContain(">设置<");
    expect(html).not.toContain("语言");
    expect(html).not.toContain("?lang=");
  });

  it("renders translated project navigation without locale query parameters", () => {
    const html = renderToStaticMarkup(
      <AppShell
        currentPath="/projects/payments/review"
        contentWidth="wide"
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

    expect(html).toContain("shell-panel shell-panel--wide");
    expect(html).toContain(">支付平台<");
    expect(html).toContain("当前项目");
    expect(html).toContain("打开工作台");
    expect(html).toContain('href="/projects/payments"');
    expect(html).toContain("project-context-card");
    expect(html).toContain("项目切换");
    expect(html).toContain('href="/projects/payments/test-cases"');
    expect(html).toContain(">测试用例<");
    expect(html).toContain(">项目技能<");
    expect(html).toContain('href="/projects/payments/review"');
    expect(html).toContain(">评审<");
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain("?lang=");
  });
});
