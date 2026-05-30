import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ReviewEditor } from "../../components/review-editor";

describe("ReviewEditor", () => {
  it("renders a no-selection message when no review item is active", () => {
    const html = renderToStaticMarkup(<ReviewEditor item={null} />);

    expect(html).toContain("未选择测试用例");
    expect(html).toContain("从评审队列中选择一个草稿");
  });

  it("renders editable step fields when a review item is selected", () => {
    const html = renderToStaticMarkup(
      <ReviewEditor
        item={{
          id: "case-101",
          projectId: "payments",
          title: "Create order",
          status: "draft",
          module: "Checkout",
          feature: "Card payment",
          caseType: "functional",
          priority: "high",
          preconditions: ["Valid shopper account"],
          steps: [{ text: "Open order page" }],
          expectedResults: [{ text: "Order page is visible" }],
          tags: ["smoke"],
          automationFlag: false,
          automationNotes: null,
        }}
      />,
    );

    expect(html).toContain("评审草稿");
    expect(html).toContain("当前状态");
    expect(html).toContain("新增步骤");
    expect(html).toContain('name="step-1"');
    expect(html).toContain(">Open order page</textarea>");
    expect(html).toContain('type="checkbox"');
  });
});
