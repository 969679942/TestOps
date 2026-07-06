import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TestCaseListWorkspace } from "../../components/test-case-list-workspace";

describe("TestCaseListWorkspace", () => {
  it("renders the directory tree, preserved flow actions, and case results table", () => {
    const html = renderToStaticMarkup(
      <TestCaseListWorkspace
        projectId="1"
        testCases={[
          {
            id: "101",
            projectId: "1",
            directoryId: "11",
            title: "Create order with saved card",
            status: "draft",
            module: "Checkout",
            feature: "Card payment",
            caseType: "functional",
            priority: "high",
            preconditions: ["Saved card exists"],
            steps: [{ text: "Open checkout" }],
            expectedResults: [{ text: "Order completes" }],
            tags: ["smoke"],
            automationFlag: true,
            automationNotes: null,
            uiContext: null,
            publishedAt: null,
          },
        ]}
        directories={[
          {
            id: "10",
            projectId: "1",
            name: "测试特性目录",
            parentId: null,
            count: 1,
            children: [
              {
                id: "11",
                projectId: "1",
                name: "登录",
                parentId: "10",
                count: 1,
                children: [],
              },
            ],
          },
        ]}
        showGeneratedBanner
      />,
    );

    expect(html).toContain("上传资料生成");
    expect(html).toContain("导入用例");
    expect(html).toContain("进入评审");
    expect(html).toContain("测试特性目录");
    expect(html).toContain("登录");
    expect(html).toContain("用例标题");
    expect(html).toContain("模块");
    expect(html).toContain("功能点");
    expect(html).toContain("步骤数");
    expect(html).toContain("Create order with saved card");
    expect(html).toContain("/projects/1/test-cases/new");
  });
});
