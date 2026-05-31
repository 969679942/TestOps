import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../components/app-shell";
import { Breadcrumbs } from "../../components/breadcrumbs";

describe("project name overflow treatment", () => {
  it("renders the sidebar project name with truncation hooks", () => {
    const html = renderToStaticMarkup(
      <AppShell
        project={{
          id: "1",
          name: "cccccccccccccccccccccccccccccccccccccccc",
          code: "demo",
          description: null,
          status: "active",
          defaultProvider: "cursor",
          defaultPromptProfile: "default",
        }}
      >
        <div>content</div>
      </AppShell>,
    );

    expect(html).toContain("shell-project-name");
    expect(html).toContain('title="cccccccccccccccccccccccccccccccccccccccc"');
  });

  it("renders breadcrumb labels with truncation hooks", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs
        items={[
          { label: "项目", href: "/" },
          { label: "cccccccccccccccccccccccccccccccccccccccc" },
        ]}
      />,
    );

    expect(html).toContain("breadcrumb-label");
    expect(html).toContain('title="cccccccccccccccccccccccccccccccccccccccc"');
  });
});
