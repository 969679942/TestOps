import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateProjectForm } from "../../components/create-project-form";

describe("CreateProjectForm", () => {
  it("does not expose the internal project code field in the UI", () => {
    const html = renderToStaticMarkup(<CreateProjectForm />);

    expect(html).toContain("创建项目");
    expect(html).toContain("项目名称");
    expect(html).not.toContain("项目代号");
    expect(html).not.toContain("payments-platform");
    expect(html).not.toContain("支付平台");
    expect(html).not.toContain("结账、退款与结算相关流程");
  });
});
