import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const {
  getProjectMock,
  createDocumentVersionMock,
  createGenerationTaskMock,
  createProjectDocumentMock,
  createAutomationGenerationMock,
  createAutomationRunMock,
  addTestCaseReviewMock,
  listProjectAutomationGenerationsMock,
  listProjectAutomationRunsMock,
  listProjectDocumentsMock,
  listProjectGenerationTasksMock,
  listProjectsMock,
  listProjectPublishedTestCasesMock,
  listProjectTestCasesMock,
  parseDocumentVersionMock,
  publishTestCaseMock,
  updateTestCaseMock,
} = vi.hoisted(() => ({
  getProjectMock: vi.fn(),
  createDocumentVersionMock: vi.fn(),
  createGenerationTaskMock: vi.fn(),
  createProjectDocumentMock: vi.fn(),
  createAutomationGenerationMock: vi.fn(),
  createAutomationRunMock: vi.fn(),
  addTestCaseReviewMock: vi.fn(),
  listProjectAutomationGenerationsMock: vi.fn(),
  listProjectAutomationRunsMock: vi.fn(),
  listProjectDocumentsMock: vi.fn(),
  listProjectGenerationTasksMock: vi.fn(),
  listProjectsMock: vi.fn(),
  listProjectPublishedTestCasesMock: vi.fn(),
  listProjectTestCasesMock: vi.fn(),
  parseDocumentVersionMock: vi.fn(),
  publishTestCaseMock: vi.fn(),
  updateTestCaseMock: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  addTestCaseReview: addTestCaseReviewMock,
  createDocumentVersion: createDocumentVersionMock,
  createGenerationTask: createGenerationTaskMock,
  createProjectDocument: createProjectDocumentMock,
  createAutomationGeneration: createAutomationGenerationMock,
  createAutomationRun: createAutomationRunMock,
  getProject: getProjectMock,
  listProjectAutomationGenerations: listProjectAutomationGenerationsMock,
  listProjectAutomationRuns: listProjectAutomationRunsMock,
  listProjectDocuments: listProjectDocumentsMock,
  listProjectGenerationTasks: listProjectGenerationTasksMock,
  listProjects: listProjectsMock,
  listProjectPublishedTestCases: listProjectPublishedTestCasesMock,
  listProjectTestCases: listProjectTestCasesMock,
  parseDocumentVersion: parseDocumentVersionMock,
  publishTestCase: publishTestCaseMock,
  updateTestCase: updateTestCaseMock,
}));

import HomePage from "../../app/page";
import ProjectWorkspacePage from "../../app/projects/[projectId]/page";
import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import ProjectGenerationTasksPage from "../../app/projects/[projectId]/generation-tasks/page";
import ProjectReviewPage from "../../app/projects/[projectId]/review/page";
import ProjectTestCasesPage from "../../app/projects/[projectId]/test-cases/page";
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

  it("renders the project directory in Chinese when lang is zh", async () => {
    listProjectsMock.mockResolvedValue({
      kind: "success",
      projects: [],
    });

    const html = renderToStaticMarkup(
      await HomePage({
        searchParams: Promise.resolve({ lang: "zh" }),
      }),
    );

    expect(html).toContain("项目目录");
    expect(html).toContain("管理项目空间");
    expect(html).toContain("English");
  });

  it("renders a lightweight settings page for the shell navigation target", async () => {
    const html = renderToStaticMarkup(await SettingsPage());

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
    expect(html).toContain("Attach source document");
    expect(html).toContain("Paste document content");
    expect(html).toContain("Trigger parse after save");
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
    expect(html).toContain("Queue generation run");
    expect(html).toContain("Input document IDs");
    expect(html).toContain("Task #gen-101");
    expect(html).toContain("gpt-4.1-mini");
    expect(html).toContain("Document Center");
  });

  it("renders the test case route with draft inventory and review navigation", async () => {
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
    listProjectTestCasesMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "case-101",
          projectId: "1",
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
          automationNotes: "Reuse checkout fixture",
        },
      ],
    });
    listProjectPublishedTestCasesMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "case-201",
          projectId: "1",
          title: "Published wallet checkout",
          status: "published",
          module: "Checkout",
          feature: "Wallet payment",
          caseType: "functional",
          priority: "high",
          preconditions: ["Wallet balance exists"],
          steps: [{ text: "Open checkout" }],
          expectedResults: [{ text: "Order completes" }],
          tags: ["wallet"],
          automationFlag: true,
          automationNotes: "Use wallet fixture",
        },
      ],
    });
    listProjectAutomationGenerationsMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "gen-501",
          testCaseId: "case-201",
          status: "completed",
          framework: "playwright",
          language: "typescript",
          pattern: "pom",
          artifactRoot: "var/artifacts/automation",
          artifactPaths: {
            spec: "var/artifacts/automation/tests/published.spec.ts",
            page_object: "var/artifacts/automation/pages/published.page.ts",
          },
          errorMessage: null,
          createdAt: "2026-05-20T10:00:00Z",
          completedAt: "2026-05-20T10:00:01Z",
        },
      ],
    });
    listProjectAutomationRunsMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "run-901",
          automationGenerationId: "gen-501",
          status: "queued",
          triggerMode: "manual",
          reportPath: null,
          summary: {},
          errorMessage: null,
          createdAt: "2026-05-20T10:02:00Z",
          startedAt: null,
          finishedAt: null,
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectTestCasesPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Test Case Library");
    expect(html).toContain("Create order with saved card");
    expect(html).toContain("Published automation handoff");
    expect(html).toContain("Published wallet checkout");
    expect(html).toContain("Generate automation");
    expect(html).toContain("Latest automation artifact");
    expect(html).toContain("published.spec.ts");
    expect(html).toContain("published.page.ts");
    expect(html).toContain("Run automation");
    expect(html).toContain("Latest automation run");
    expect(html).toContain("queued");
    expect(html).toContain("Review Workspace");
  });

  it("renders the review route baseline with no active selection", async () => {
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
    listProjectTestCasesMock.mockResolvedValue({
      kind: "success",
      items: [],
    });

    const html = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Review Workspace");
    expect(html).toContain("No test case selected");
    expect(html).toContain("Test Cases");
  });

  it("renders the selected test case inside the review workspace", async () => {
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
    listProjectTestCasesMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "case-101",
          projectId: "1",
          title: "Create order with saved card",
          status: "draft",
          module: "Checkout",
          feature: "Card payment",
          caseType: "functional",
          priority: "high",
          preconditions: ["Saved card exists"],
          steps: [{ text: "Open order page" }],
          expectedResults: [{ text: "Order completes" }],
          tags: ["smoke"],
          automationFlag: true,
          automationNotes: "Reuse checkout fixture",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({ caseId: "case-101" }),
      }),
    );

    expect(html).toContain("Review draft");
    expect(html).toContain('name="step-1"');
    expect(html).toContain("Save draft");
    expect(html).toContain("Approve");
    expect(html).toContain("Publish");
    expect(html).not.toContain("No test case selected");
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

  it("renders unavailable counts instead of zeroes for test case http errors", async () => {
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
    listProjectTestCasesMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectPublishedTestCasesMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectAutomationGenerationsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectAutomationRunsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });

    const html = renderToStaticMarkup(
      await ProjectTestCasesPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Test cases are temporarily unavailable");
    expect(html).toContain(">Unavailable<");
    expect(html).not.toContain(">0<");
  });

  it("renders a review API error state instead of a false no-selection editor", async () => {
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
    listProjectTestCasesMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });

    const html = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({ caseId: "case-101" }),
      }),
    );

    expect(html).toContain("Test cases are temporarily unavailable");
    expect(html).not.toContain("No test case selected");
    expect(html).not.toContain("Review draft");
  });
});
