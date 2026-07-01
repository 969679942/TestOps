// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SkillVersionPublishAction } from "../../components/skill-version-publish-action";

describe("SkillVersionPublishAction interactions", () => {
  it("uses the shared confirmation modal before publishing a production version", () => {
    render(
      <SkillVersionPublishAction
        action={vi.fn()}
        versionId="200"
        versionLabel="v0 Draft"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "发布为生产版本" }));

    expect(screen.getByRole("dialog", { name: "确认发布生产版本" })).toBeTruthy();
    expect(screen.getByText("发布后该版本将成为项目可绑定的生产规则。当前版本：v0 Draft。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认发布" })).toBeTruthy();
  });
});
