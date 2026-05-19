import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ReviewEditor } from "../../components/review-editor";

describe("ReviewEditor", () => {
  it("renders a no-selection message when no review item is active", () => {
    const html = renderToStaticMarkup(<ReviewEditor item={null} />);

    expect(html).toContain("No test case selected");
    expect(html).toContain("Choose a draft from the review queue");
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

    expect(html).toContain("Review draft");
    expect(html).toContain("<textarea");
    expect(html).toContain("Open order page");
  });
});
