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
    expect(html).toContain(">Projects<");
    expect(html).toContain('href="/settings"');
    expect(html).toContain(">Settings<");
  });
});
