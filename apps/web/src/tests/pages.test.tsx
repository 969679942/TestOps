import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { getProjectMock, listProjectDocumentsMock, listProjectsMock } = vi.hoisted(() => ({
  getProjectMock: vi.fn(),
  listProjectDocumentsMock: vi.fn(),
  listProjectsMock: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  getProject: getProjectMock,
  listProjectDocuments: listProjectDocumentsMock,
  listProjects: listProjectsMock,
}));

import HomePage from "../../app/page";
import ProjectWorkspacePage from "../../app/projects/[projectId]/page";
import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import SettingsPage from "../../app/settings/page";

describe("workspace pages", () => {
  it("renders a project-directory unavailable state for project list http errors", async () => {
    listProjectsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Projects are temporarily unavailable");
    expect(html).not.toContain("Payments Platform");
  });

  it("renders a lightweight settings page for the shell navigation target", () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain(">Settings<");
    expect(html).toContain("Project defaults and workspace preferences");
  });

  it("renders document availability instead of a zero count on document list http errors", async () => {
    getProjectMock.mockResolvedValue({
      id: "1",
      name: "Payments Platform",
      code: "payments",
      description: "Checkout and settlement flows.",
      status: "active",
      defaultProvider: "cursor",
      defaultPromptProfile: "default",
    });
    listProjectDocumentsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });

    const html = renderToStaticMarkup(
      await ProjectWorkspacePage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Source documents are temporarily unavailable");
    expect(html).toContain(">Unavailable<");
    expect(html).not.toContain(">0<");
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
