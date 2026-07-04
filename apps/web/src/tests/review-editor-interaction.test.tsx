// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewEditor } from "../../components/review-editor";

const reviewItem = {
  id: "case-101",
  projectId: "payments",
  title: "Create order",
  status: "approved",
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
};

afterEach(() => {
  cleanup();
});

describe("ReviewEditor interactions", () => {
  it("blocks publishing until a review item is approved", () => {
    render(
      <ReviewEditor
        item={{
          ...reviewItem,
          status: "draft",
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: "发布" })).toBeNull();
    expect(screen.getByText("请先批准用例，再执行发布。")).toBeTruthy();
  });

  it("uses shared confirmation modals before rejecting or publishing", () => {
    const rejectAction = vi.fn();
    const publishAction = vi.fn();

    render(
      <ReviewEditor
        item={reviewItem}
        rejectAction={rejectAction}
        publishAction={publishAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "驳回" }));

    expect(rejectAction).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "确认驳回用例？" })).toBeTruthy();
    expect(screen.getByText("驳回后该用例将标记为已驳回，不会进入发布流程。")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "确认驳回" }));

    expect(rejectAction).toHaveBeenCalledTimes(1);
    let formData = rejectAction.mock.calls[0][0] as FormData;
    expect(formData.get("title")).toBe("Create order");

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "发布" }));

    expect(publishAction).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "确认发布用例？" })).toBeTruthy();
    expect(screen.getByText("发布后内容将锁定，并提供给下游自动化流程使用。")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "确认发布" }));

    expect(publishAction).toHaveBeenCalledTimes(1);
    formData = publishAction.mock.calls[0][0] as FormData;
    expect(formData.get("title")).toBe("Create order");
  });
});
