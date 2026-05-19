import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const {
  getProjectMock,
  listProjectDocumentsMock,
  listProjectGenerationTasksMock,
  listProjectsMock,
} = vi.hoisted(() => ({
  getProjectMock: vi.fn(),
  listProjectDocumentsMock: vi.fn(),
  listProjectGenerationTasksMock: vi.fn(),
  listProjectsMock: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  getProject: getProjectMock,
  listProjectDocuments: listProjectDocumentsMock,
  listProjectGenerationTasks: listProjectGenerationTasksMock,
  listProjects: listProjectsMock,
}));

import HomePage from "../../app/page";
import ProjectWorkspacePage from "../../app/projects/[projectId]/page";
import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import ProjectGenerationTasksPage from "../../app/projects/[projectId]/generation-tasks/page";
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
      kind: "success",
      project: {
        id: "1",
        name: "Payments Platform",
        code: "payments",
        description: "Checkout and settlement flows.",
        status: "active",
        defaultProvider: "cursor",
        defaultPromptProfile: "default",
      },
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
      kind: "success",
      project: {
        id: "1",
        name: "Payments Platform",
        code: "payments",
        description: "Checkout and settlement flows.",
        status: "active",
        defaultProvider: "cursor",
        defaultPromptProfile: "default",
      },
    });
    listProjectDocumentsMock.mockResolvedValue({
      kind: "success",
      documents: [
        {
          id: "prd-v2",
          projectId: "1",
          type: "prd",
          name: "Payments PRD",
          sourceMode: "upload",
          sourceUri: "prd/payments-v2.pdf",
          parseStatus: "parsed",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectDocumentsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Document Center");
    expect(html).toContain("Document assets");
    expect(html).toContain("Payments PRD");
    expect(html).toContain("Generation Tasks");
  });

  it("renders generation task history when the route resolves successfully", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: {
        id: "1",
        name: "Payments Platform",
        code: "payments",
        description: "Checkout and settlement flows.",
        status: "active",
        defaultProvider: "cursor",
        defaultPromptProfile: "default",
      },
    });
    listProjectGenerationTasksMock.mockResolvedValue({
      kind: "success",
      tasks: [
        {
          id: "gen-101",
          projectId: "1",
          status: "queued",
          provider: "cursor",
          model: "gpt-4.1-mini",
          promptVersion: "default",
          inputRefs: {
            document_ids: ["prd-v2", "swagger-checkout"],
          },
          startedAt: null,
          finishedAt: null,
          errorMessage: null,
          createdAt: "2026-05-18T09:30:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectGenerationTasksPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Generation Queue");
    expect(html).toContain("Task #gen-101");
    expect(html).toContain("gpt-4.1-mini");
    expect(html).toContain("Document Center");
  });

  it("renders an API error state instead of a false not-found screen for documents", async () => {
    getProjectMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });

    const html = renderToStaticMarkup(
      await ProjectDocumentsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Project unavailable");
    expect(html).toContain("could not be loaded because the API returned an error");
    expect(html).not.toContain("Project not found");
  });

  it("renders an API error state instead of a false not-found screen for generation tasks", async () => {
    getProjectMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });

    const html = renderToStaticMarkup(
      await ProjectGenerationTasksPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Project unavailable");
    expect(html).toContain("could not be loaded because the API returned an error");
    expect(html).not.toContain("Project not found");
  });
});
