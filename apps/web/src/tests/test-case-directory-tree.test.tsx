import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TestCaseDirectoryTree } from "../../components/test-case-directory-tree";

describe("TestCaseDirectoryTree", () => {
  it("renders two-level directories with counts and selected state", () => {
    const html = renderToStaticMarkup(
      <TestCaseDirectoryTree
        directories={[
          {
            id: "10",
            projectId: "1",
            name: "测试特性目录",
            parentId: null,
            count: 3,
            children: [
              {
                id: "11",
                projectId: "1",
                name: "登录",
                parentId: "10",
                count: 2,
                children: [],
              },
            ],
          },
        ]}
        selectedDirectoryId="11"
      />,
    );

    expect(html).toContain("测试特性目录");
    expect(html).toContain("登录");
    expect(html).toContain(">3<");
    expect(html).toContain(">2<");
    expect(html).toContain('aria-current="true"');
    expect(html).toContain("未分类");
  });
});
