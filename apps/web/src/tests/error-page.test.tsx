import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import RootErrorPage from "../../app/error";

describe("RootErrorPage", () => {
  it("renders a centered compact error dialog with primary and secondary actions", () => {
    const html = renderToStaticMarkup(
      <RootErrorPage
        error={Object.assign(new Error("Request failed with status 500"), {
          digest: "test",
        })}
        reset={vi.fn()}
      />,
    );

    expect(html).toContain("error-page-dialog");
    expect(html).toContain("error-page-dialog-icon");
    expect(html).toContain("页面加载失败");
    expect(html).toContain("Request failed with status 500");
    expect(html).toContain("重试");
    expect(html).toContain("返回首页");
  });
});
