// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestCaseComposer } from "../../components/test-case-composer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("TestCaseComposer interactions", () => {
  it("focuses the first invalid field after submit", async () => {
    render(
      <TestCaseComposer
        mode="create"
        projectId="1"
        directories={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "创建用例" }));

    const titleInput = screen.getByPlaceholderText("请输入测试用例名称");

    await waitFor(() => {
      expect(document.activeElement).toBe(titleInput);
    });
  });
});
