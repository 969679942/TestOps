import { describe, expect, it } from "vitest";

import {
  parseTestCaseMarkdownFile,
  testCaseMarkdownImportTemplate,
} from "../../lib/test-case-markdown-import";

describe("test-case-markdown-import", () => {
  it("parses the bundled template into two functional cases", () => {
    const cases = parseTestCaseMarkdownFile(testCaseMarkdownImportTemplate);

    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({
      title: "使用有效账号登录并进入首页",
      module: "认证",
      feature: "登录",
      caseType: "functional",
      priority: "high",
      automationFlag: false,
      tags: ["TC-AUTH-001", "smoke", "login"],
    });
    expect(cases[0].steps).toHaveLength(3);
    expect(cases[0].expectedResults).toHaveLength(3);
    expect(cases[0].preconditions).toEqual([
      "测试账号 qa_user 已开通且未锁定",
      "登录页面可正常访问",
    ]);
    expect(cases[1]).toMatchObject({
      title: "拒绝无效密码登录",
      priority: "medium",
      tags: ["TC-AUTH-002", "negative"],
    });
  });

  it("supports concise section headers without colons", () => {
    const cases = parseTestCaseMarkdownFile(`
用例标题：保存标准商品

所属模块：商品管理 -> 商品

优先级：P1

前置条件
已登录且有商品管理权限。

测试步骤
1. 新增商品，选择「标准商品」。
2. 商品名称填写 TC_ITEM_001。
3. 点击保存。

预期结果
1. 保存成功，出现成功提示。
2. 列表可搜索到 TC_ITEM_001。
`);

    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      title: "保存标准商品",
      module: "商品管理",
      feature: "商品",
      preconditions: ["已登录且有商品管理权限。"],
    });
  });

  it("rejects cases missing required sections", () => {
    expect(() =>
      parseTestCaseMarkdownFile(`
用例标题：缺少步骤

所属模块：认证 -> 登录

预期结果
1. 不会导入
`),
    ).toThrow("缺少「测试步骤」");
  });

  it("rejects more than 100 cases", () => {
    const blocks = Array.from({ length: 101 }, (_, index) => `
用例标题：Case ${index + 1}

所属模块：模块 -> 功能

测试步骤
1. 执行操作

预期结果
1. 符合预期
`).join("\n---\n");

    expect(() => parseTestCaseMarkdownFile(blocks)).toThrow("单次最多导入 100 条用例。");
  });
});
