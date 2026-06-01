import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TestCaseComposer } from "../../components/test-case-composer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("TestCaseComposer layout", () => {
  it("renders a unified two-column editor with metadata sidebar and structured step table", () => {
    const html = renderToStaticMarkup(
      <TestCaseComposer
        mode="create"
        projectId="1"
        directories={[
          {
            id: "10",
            projectId: "1",
            name: "测试特性目录",
            parentId: null,
            children: [
              {
                id: "11",
                projectId: "1",
                name: "登录",
                parentId: "10",
                children: [],
              },
            ],
          },
        ]}
      />,
    );

    expect(html).toContain("case-editor-layout");
    expect(html).toContain("名称");
    expect(html).toContain("执行方式");
    expect(html).toContain("前置条件");
    expect(html).toContain("测试步骤");
    expect(html).toContain("基本信息");
    expect(html).toContain("编号");
    expect(html).toContain("用例等级");
    expect(html).toContain("归属目录");
    expect(html).toContain("测试特性目录");
    expect(html).toContain("登录");
    expect(html).toContain("添加步骤");
  });
});
