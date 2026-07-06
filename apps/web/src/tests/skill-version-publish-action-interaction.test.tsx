// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SkillVersionPublishAction } from "../../components/skill-version-publish-action";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("SkillVersionPublishAction interactions", () => {
  it("uses the shared confirmation modal before publishing a production version", () => {
    const action = vi.fn().mockResolvedValue(undefined);

    render(
      <SkillVersionPublishAction
        action={action}
        versionId="200"
        versionLabel="v0 Draft"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "发布为生产版本" }));

    expect(screen.getByRole("dialog", { name: "确认发布生产版本" })).toBeTruthy();
    expect(screen.getByText("发布后该版本将成为项目可绑定的生产规则。当前版本：v0 Draft。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认发布" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "确认发布" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("versionId")).toBe("200");
  });
});
