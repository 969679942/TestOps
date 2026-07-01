// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SkillVersionRollbackAction } from "../../components/skill-version-rollback-action";

describe("SkillVersionRollbackAction interactions", () => {
  it("uses the shared confirmation modal before rolling back a production version", () => {
    const action = vi.fn();

    render(
      <SkillVersionRollbackAction
        action={action}
        versionId="200"
        versionLabel="v0 Draft"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "回滚为当前生产版本" }));

    expect(screen.getByRole("dialog", { name: "确认回滚生产版本？" })).toBeTruthy();
    expect(screen.getByText("回滚后当前生产规则会切换到该版本。当前版本：v0 Draft。")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "确认回滚" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("versionId")).toBe("200");
  });
});
