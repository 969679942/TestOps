import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { getProjectMock } = vi.hoisted(() => ({
  getProjectMock: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  getProject: getProjectMock,
}));

import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import SettingsPage from "../../app/settings/page";

describe("workspace pages", () => {
  it("renders a lightweight settings page for the shell navigation target", () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain(">Settings<");
    expect(html).toContain("Project defaults and workspace preferences");
  });

  it("renders the documents route as a Task 7 scaffold", async () => {
    getProjectMock.mockResolvedValue({
      id: "1",
      name: "Payments Platform",
      code: "payments",
      description: "Checkout and settlement flows.",
      status: "active",
      defaultProvider: "cursor",
      defaultPromptProfile: "default",
    });

    const html = renderToStaticMarkup(
      await ProjectDocumentsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Document Workspace");
    expect(html).toContain("Task 7 scaffold");
    expect(html).not.toContain("document-card");
  });
});
