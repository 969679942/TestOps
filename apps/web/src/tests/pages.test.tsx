import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const {
  getProjectMock,
  getRuntimeSettingsMock,
  createDocumentVersionMock,
  createGenerationTaskMock,
  createProjectDocumentMock,
  createAutomationGenerationMock,
  createAutomationDebugProposalMock,
  createAutomationDebugProposalRerunMock,
  createAutomationFinalReportMock,
  createAutomationFailureAnalysisMock,
  createAutomationRerunMock,
  createAutomationRunMock,
  addTestCaseReviewMock,
  listProjectAutomationGenerationsMock,
  listProjectAutomationFailureAnalysesMock,
  listProjectAutomationDebugProposalsMock,
  listProjectAutomationFinalReportsMock,
  listProjectAutomationRunsMock,
  listProjectAutomationSchedulesMock,
  listProjectAutomationReportsMock,
  listProjectDataSetupExecutionsMock,
  listProjectDataSetupHintsMock,
  listProjectDocumentsMock,
  listProjectEnvironmentsMock,
  listProjectGenerationTasksMock,
  listProjectsMock,
  listProjectPublishedTestCasesMock,
  listProjectTestCasesMock,
  parseDocumentVersionMock,
  publishTestCaseMock,
  updateTestCaseMock,
  reviewAutomationDebugProposalMock,
  pushAutomationFinalReportToLarkMock,
} = vi.hoisted(() => ({
  getProjectMock: vi.fn(),
  getRuntimeSettingsMock: vi.fn(),
  createDocumentVersionMock: vi.fn(),
  createGenerationTaskMock: vi.fn(),
  createProjectDocumentMock: vi.fn(),
  createAutomationGenerationMock: vi.fn(),
  createAutomationDebugProposalMock: vi.fn(),
  createAutomationDebugProposalRerunMock: vi.fn(),
  createAutomationFinalReportMock: vi.fn(),
  createAutomationFailureAnalysisMock: vi.fn(),
  createAutomationRerunMock: vi.fn(),
  createAutomationRunMock: vi.fn(),
  addTestCaseReviewMock: vi.fn(),
  listProjectAutomationGenerationsMock: vi.fn(),
  listProjectAutomationFailureAnalysesMock: vi.fn(),
  listProjectAutomationDebugProposalsMock: vi.fn(),
  listProjectAutomationFinalReportsMock: vi.fn(),
  listProjectAutomationRunsMock: vi.fn(),
  listProjectAutomationSchedulesMock: vi.fn(),
  listProjectAutomationReportsMock: vi.fn(),
  listProjectDataSetupExecutionsMock: vi.fn(),
  listProjectDataSetupHintsMock: vi.fn(),
  listProjectDocumentsMock: vi.fn(),
  listProjectEnvironmentsMock: vi.fn(),
  listProjectGenerationTasksMock: vi.fn(),
  listProjectsMock: vi.fn(),
  listProjectPublishedTestCasesMock: vi.fn(),
  listProjectTestCasesMock: vi.fn(),
  parseDocumentVersionMock: vi.fn(),
  publishTestCaseMock: vi.fn(),
  updateTestCaseMock: vi.fn(),
  reviewAutomationDebugProposalMock: vi.fn(),
  pushAutomationFinalReportToLarkMock: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  addTestCaseReview: addTestCaseReviewMock,
  createDocumentVersion: createDocumentVersionMock,
  createGenerationTask: createGenerationTaskMock,
  createProjectDocument: createProjectDocumentMock,
  createAutomationGeneration: createAutomationGenerationMock,
  createAutomationDebugProposal: createAutomationDebugProposalMock,
  createAutomationDebugProposalRerun: createAutomationDebugProposalRerunMock,
  createAutomationFinalReport: createAutomationFinalReportMock,
  createAutomationFailureAnalysis: createAutomationFailureAnalysisMock,
  createAutomationRerun: createAutomationRerunMock,
  createAutomationRun: createAutomationRunMock,
  getProject: getProjectMock,
  getRuntimeSettings: getRuntimeSettingsMock,
  listProjectAutomationGenerations: listProjectAutomationGenerationsMock,
  listProjectAutomationFailureAnalyses: listProjectAutomationFailureAnalysesMock,
  listProjectAutomationDebugProposals: listProjectAutomationDebugProposalsMock,
  listProjectAutomationFinalReports: listProjectAutomationFinalReportsMock,
  listProjectAutomationRuns: listProjectAutomationRunsMock,
  listProjectAutomationSchedules: listProjectAutomationSchedulesMock,
  listProjectAutomationReports: listProjectAutomationReportsMock,
  listProjectDataSetupExecutions: listProjectDataSetupExecutionsMock,
  listProjectDataSetupHints: listProjectDataSetupHintsMock,
  listProjectDocuments: listProjectDocumentsMock,
  listProjectEnvironments: listProjectEnvironmentsMock,
  listProjectGenerationTasks: listProjectGenerationTasksMock,
  listProjects: listProjectsMock,
  listProjectPublishedTestCases: listProjectPublishedTestCasesMock,
  listProjectTestCases: listProjectTestCasesMock,
  parseDocumentVersion: parseDocumentVersionMock,
  publishTestCase: publishTestCaseMock,
  updateTestCase: updateTestCaseMock,
  reviewAutomationDebugProposal: reviewAutomationDebugProposalMock,
  pushAutomationFinalReportToLark: pushAutomationFinalReportToLarkMock,
}));

import HomePage from "../../app/page";
import ProjectWorkspacePage from "../../app/projects/[projectId]/page";
import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import ProjectGenerationTasksPage from "../../app/projects/[projectId]/generation-tasks/page";
import ProjectReviewPage from "../../app/projects/[projectId]/review/page";
import ProjectTestCasesPage from "../../app/projects/[projectId]/test-cases/page";
import ProjectAutomationSchedulesPage from "../../app/projects/[projectId]/automation-schedules/page";
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
    expect(html).toContain("英文");
  });

  it("renders a lightweight settings page for the shell navigation target", async () => {
    getRuntimeSettingsMock.mockResolvedValue({
      kind: "success",
      settings: {
        cursor: {
          command: "cursor-agent",
          timeoutSeconds: 180,
          cwd: "D:/TestOps",
        },
        codex: {
          failureAnalysisModel: "codex-provider-boundary",
        },
        notifications: {
          larkWebhookConfigured: false,
        },
        runner: {
          framework: "playwright",
          language: "typescript",
          pattern: "pom",
          reporter: "allure-playwright",
        },
      },
    });

    const html = renderToStaticMarkup(await SettingsPage());

    expect(html).toContain(">Settings<");
    expect(html).toContain("Cursor/Codex");
    expect(html).toContain("cursor-agent");
    expect(html).toContain("Lark");
    expect(html).toContain("Not configured");
    expect(html).toContain("Playwright + TypeScript + POM");
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
    listProjectEnvironmentsMock.mockResolvedValue({
      kind: "success",
      environments: [
        {
          id: "env-1",
          projectId: "1",
          name: "Payments Staging",
          code: "staging",
          baseUrl: "https://staging.payments.example",
          apiBaseUrl: "https://api-staging.payments.example",
          authProfile: "qa-staging",
          status: "active",
          createdAt: "2026-05-21T09:00:00Z",
          updatedAt: "2026-05-21T09:00:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectWorkspacePage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Source documents are temporarily unavailable");
    expect(html).toContain("Target environments");
    expect(html).toContain("Payments Staging");
    expect(html).toContain("https://staging.payments.example");
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
          status: "failed",
          triggerMode: "manual",
          reportPath: "automation/reports/run-901/index.html",
          summary: {
            passed: 3,
            failed: 1,
          },
          errorMessage: "Locator timeout",
          createdAt: "2026-05-20T10:02:00Z",
          startedAt: "2026-05-20T10:02:01Z",
          finishedAt: "2026-05-20T10:02:10Z",
        },
      ],
    });
    listProjectAutomationReportsMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "report-701",
          automationRunId: "run-901",
          kind: "allure",
          artifactRoot: "automation/reports/run-901",
          indexPath: "automation/reports/run-901/index.html",
          summary: {
            passed: 3,
            failed: 1,
            duration_ms: 1240,
          },
          createdAt: "2026-05-21T12:00:00Z",
        },
      ],
    });
    listProjectAutomationFailureAnalysesMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "analysis-301",
          automationRunId: "run-901",
          status: "completed",
          provider: "codex",
          model: "codex-placeholder",
          classification: "automation_issue",
          confidence: 0.82,
          summary: "Codex placeholder analysis classified a locator timeout.",
          recommendations: ["Inspect the selector", "Rerun after stabilizing the wait"],
          shouldRerun: true,
          createdAt: "2026-05-21T08:00:00Z",
          completedAt: "2026-05-21T08:00:01Z",
        },
      ],
    });
    listProjectAutomationDebugProposalsMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "proposal-401",
          automationFailureAnalysisId: "analysis-301",
          status: "draft",
          proposalType: "patch_proposal",
          summary: "Manual review required before rerun.",
          patchProposal: {
            manual_review_required: true,
          },
          recommendations: ["Stabilize the submit button locator."],
          reviewerId: null,
          reviewComment: null,
          createdAt: "2026-05-21T08:00:02Z",
          reviewedAt: null,
        },
      ],
    });
    listProjectAutomationFinalReportsMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "final-report-501",
          projectId: "1",
          automationRunId: "run-901",
          status: "ready",
          title: "Final automation report - Published wallet checkout",
          summary: {
            run_status: "failed",
            allure: {
              passed: 3,
              failed: 1,
            },
          },
          content: "# Final automation report",
          larkStatus: "pending",
          larkError: null,
          createdAt: "2026-05-21T12:10:00Z",
          pushedAt: null,
        },
      ],
    });
    listProjectDataSetupHintsMock.mockResolvedValue({
      kind: "success",
      hints: [
        {
          id: "hint-401",
          testCaseId: "case-201",
          documentVersionId: "doc-version-1",
          environmentId: "env-1",
          endpoint: "/orders",
          method: "post",
          requestTemplate: {
            customer_id: "{{customer_id}}",
          },
          purpose: "Create order data",
          confidenceScore: 0.86,
          status: "ready",
          createdAt: "2026-05-21T10:00:00Z",
          updatedAt: "2026-05-21T10:00:00Z",
        },
      ],
    });
    listProjectDataSetupExecutionsMock.mockResolvedValue({
      kind: "success",
      executions: [
        {
          id: "execution-601",
          dataSetupHintId: "hint-401",
          automationRunId: "run-901",
          status: "completed",
          requestSummary: {
            method: "post",
            url: "https://api-staging.checkout.example/orders",
            body_keys: ["customer_id"],
          },
          responseSummary: {
            status_code: 201,
            json_keys: ["id"],
          },
          errorMessage: null,
          createdAt: "2026-05-21T10:01:00Z",
          completedAt: "2026-05-21T10:01:01Z",
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
    expect(html).toContain("Data setup");
    expect(html).toContain("POST /orders");
    expect(html).toContain("Create order data");
    expect(html).toContain("Data setup execution");
    expect(html).toContain("completed");
    expect(html).toContain("Status 201");
    expect(html).toContain("Latest automation run");
    expect(html).toContain("failed");
    expect(html).toContain("automation/reports/run-901/index.html");
    expect(html).toContain("Allure report");
    expect(html).toContain("Duration 1240ms");
    expect(html).toContain("Passed 3");
    expect(html).toContain("Failed 1");
    expect(html).toContain("Locator timeout");
    expect(html).toContain("Analyze failure");
    expect(html).toContain("Failure analysis");
    expect(html).toContain("automation_issue");
    expect(html).toContain("Retry recommended");
    expect(html).toContain("Debug proposal");
    expect(html).toContain("Approve proposal");
    expect(html).toContain("Final report");
    expect(html).toContain("pending");
    expect(html).toContain("Push to Lark");
    expect(html).toContain("Inspect the selector");
    expect(html).toContain("Review Workspace");
  });

  it("renders the automation schedule route with active schedules", async () => {
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
    listProjectAutomationSchedulesMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "schedule-31",
          projectId: "1",
          environmentId: "env-1",
          name: "Hourly smoke",
          targetGenerationIds: ["gen-501"],
          cronExpression: "@hourly",
          status: "active",
          nextRunAt: "2026-05-21T10:00:00Z",
          lastRunAt: null,
          createdAt: "2026-05-21T09:30:00Z",
          updatedAt: "2026-05-21T09:30:00Z",
        },
      ],
    });
    listProjectEnvironmentsMock.mockResolvedValue({
      kind: "success",
      environments: [
        {
          id: "env-1",
          projectId: "1",
          name: "Payments Staging",
          code: "staging",
          baseUrl: "https://staging.payments.example",
          apiBaseUrl: "https://api-staging.payments.example",
          authProfile: "qa-staging",
          status: "active",
          createdAt: "2026-05-21T09:00:00Z",
          updatedAt: "2026-05-21T09:00:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectAutomationSchedulesPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("Automation Schedules");
    expect(html).toContain("Hourly smoke");
    expect(html).toContain("@hourly");
    expect(html).toContain("Payments Staging");
    expect(html).toContain("1 target");
    expect(html).toContain("Next run");
    expect(html).toContain("Test Cases");
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
    listProjectAutomationReportsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectAutomationFailureAnalysesMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectAutomationDebugProposalsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectAutomationFinalReportsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectDataSetupHintsMock.mockResolvedValue({
      kind: "http-error",
      status: 503,
    });
    listProjectDataSetupExecutionsMock.mockResolvedValue({
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
