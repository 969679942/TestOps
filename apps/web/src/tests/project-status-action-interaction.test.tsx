// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectStatusAction } from "../../components/project-status-action";

vi.mock("../../lib/workspace-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/workspace-api")>();
  return {
    ...actual,
    updateProjectStatus: vi.fn(),
  };
});

describe("ProjectStatusAction interactions", () => {
  it("shows complete archive confirmation copy and an explicit confirm label", () => {
    render(<ProjectStatusAction projectId="1" status="active" />);

    fireEvent.click(screen.getByRole("button", { name: "归档项目" }));

    expect(screen.getByRole("dialog", { name: "归档项目" })).toBeTruthy();
    expect(
      screen.getByText(
        "归档后项目将从默认列表隐藏，但不会删除已有数据。历史文档、用例、生成任务和自动化计划会继续保留，只会从默认项目列表移除。",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认归档" })).toBeTruthy();
  });

  it("shows complete restore confirmation copy and an explicit confirm label", () => {
    render(<ProjectStatusAction projectId="1" status="archived" />);

    fireEvent.click(screen.getByRole("button", { name: "恢复项目" }));

    expect(screen.getByRole("dialog", { name: "恢复项目" })).toBeTruthy();
    expect(
      screen.getByText(
        "恢复后项目将重新出现在默认列表，并可继续使用。恢复后，项目将重新回到进行中项目列表，并恢复文档、用例和计划的常规操作入口。",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认恢复" })).toBeTruthy();
  });
});
