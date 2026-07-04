// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TestCaseReviewPanel } from "../../components/test-case-review-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("../../lib/workspace-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/workspace-api")>();
  return {
    ...actual,
    addTestCaseReview: vi.fn(),
    publishTestCase: vi.fn(),
  };
});

const reviewableCase = {
  id: "case-101",
  projectId: "1",
  directoryId: null,
  title: "Create order with saved card",
  status: "approved",
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
};

afterEach(() => {
  cleanup();
});

describe("TestCaseReviewPanel interactions", () => {
  it("blocks publishing until the test case is approved", () => {
    render(
      <TestCaseReviewPanel
        testCase={{
          ...reviewableCase,
          status: "draft",
        }}
        reviews={[]}
      />,
    );

    expect(screen.queryByRole("button", { name: "发布用例" })).toBeNull();
    expect(screen.getByText("请先批准用例，再执行发布。")).toBeTruthy();
  });

  it("uses the shared confirmation modal for reject and publish actions", () => {
    const browserConfirm = vi.spyOn(window, "confirm");

    render(<TestCaseReviewPanel testCase={reviewableCase} reviews={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "驳回" }));

    expect(browserConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "确认驳回用例？" })).toBeTruthy();
    expect(screen.getByText("驳回后该用例将标记为已驳回，不会进入发布流程。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认驳回" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "发布用例" }));

    expect(browserConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "确认发布用例？" })).toBeTruthy();
    expect(screen.getByText("发布后内容将锁定，并提供给下游自动化流程使用。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认发布" })).toBeTruthy();

    browserConfirm.mockRestore();
  });
});
