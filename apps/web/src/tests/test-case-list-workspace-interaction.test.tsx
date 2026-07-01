// @vitest-environment jsdom

import type React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestCaseListWorkspace } from "../../components/test-case-list-workspace";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("TestCaseListWorkspace interactions", () => {
  it("shows visible filter labels, result summary, and a reset action", () => {
    render(
      <TestCaseListWorkspace
        projectId="1"
        testCases={[
          {
            id: "101",
            projectId: "1",
            directoryId: null,
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
          {
            id: "102",
            projectId: "1",
            directoryId: null,
            title: "Refund request",
            status: "approved",
            module: "Refund",
            feature: "Card payment",
            caseType: "functional",
            priority: "medium",
            preconditions: ["Payment exists"],
            steps: [{ text: "Open refund form" }],
            expectedResults: [{ text: "Refund completes" }],
            tags: ["regression"],
            automationFlag: false,
            automationNotes: null,
            uiContext: null,
            publishedAt: null,
          },
        ]}
        directories={[]}
      />,
    );

    expect(screen.getByText("搜索").className).not.toContain("sr-only");
    expect(screen.getByText("状态筛选").className).not.toContain("sr-only");
    expect(screen.getByText("显示 2 / 2 条")).toBeTruthy();

    const searchInput = screen.getByPlaceholderText("请输入名称、模块或功能点");
    fireEvent.change(searchInput, { target: { value: "Refund" } });

    expect(screen.getByText("显示 1 / 2 条")).toBeTruthy();
    expect(screen.getByRole("button", { name: "重置" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "重置" }));

    expect((searchInput as HTMLInputElement).value).toBe("");
    expect(screen.getByText("显示 2 / 2 条")).toBeTruthy();
  });
});
