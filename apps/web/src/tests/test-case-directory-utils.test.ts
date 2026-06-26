import { describe, expect, it } from "vitest";

import { buildDirectoryTree } from "../../lib/test-case-directory-utils";

describe("buildDirectoryTree", () => {
  it("aggregates child case counts into the root directory", () => {
    const tree = buildDirectoryTree(
      [
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
      ],
      [
        {
          id: "case-1",
          projectId: "1",
          directoryId: "11",
          title: "登录成功",
          module: "认证",
          feature: "登录",
          caseType: "functional",
          priority: "high",
          preconditions: [],
          steps: [],
          expectedResults: [],
          tags: [],
          automationFlag: false,
          automationNotes: null,
          uiContext: null,
          status: "draft",
          publishedAt: null,
        },
      ],
    );

    expect(tree).toHaveLength(1);
    expect(tree[0]?.count).toBe(1);
    expect(tree[0]?.children[0]?.count).toBe(1);
  });
});
