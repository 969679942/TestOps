import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  WorkspaceApiError,
  listProjectsWithStatsMock,
  getWorkspaceProjectMock,
  listWorkspaceProjectDocumentsMock,
  listWorkspaceProjectTestCasesMock,
  listProjectTestCaseDirectoriesMock,
  getProjectMock,
  getRuntimeSettingsMock,
  createGenerationTaskMock,
  listProjectGenerationTasksMock,
  listProjectAutomationSchedulesMock,
  listProjectEnvironmentsMock,
  listProjectReviewTestCasesMock,
  addTestCaseReviewMock,
  publishTestCaseMock,
  updateTestCaseMock,
} = vi.hoisted(() => {
  class WorkspaceApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }

  return {
    WorkspaceApiError,
    listProjectsWithStatsMock: vi.fn(),
    getWorkspaceProjectMock: vi.fn(),
    listWorkspaceProjectDocumentsMock: vi.fn(),
    listWorkspaceProjectTestCasesMock: vi.fn(),
    listProjectTestCaseDirectoriesMock: vi.fn(),
    getProjectMock: vi.fn(),
    getRuntimeSettingsMock: vi.fn(),
    createGenerationTaskMock: vi.fn(),
    listProjectGenerationTasksMock: vi.fn(),
    listProjectAutomationSchedulesMock: vi.fn(),
    listProjectEnvironmentsMock: vi.fn(),
    listProjectReviewTestCasesMock: vi.fn(),
    addTestCaseReviewMock: vi.fn(),
    publishTestCaseMock: vi.fn(),
    updateTestCaseMock: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    const error = new Error("NEXT_REDIRECT");
    (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${href};307;`;
    throw error;
  },
  notFound: () => {
    const error = new Error("NEXT_NOT_FOUND");
    throw error;
  },
}));

vi.mock("../../components/create-project-modal", () => ({
  CreateProjectModal: () => null,
}));

vi.mock("../../components/project-workspace-client", () => ({
  ProjectWorkspaceClient: ({
    documents,
    testCases,
  }: {
    documents: Array<unknown>;
    testCases: Array<unknown>;
  }) => (
    <section className="data-card">
      <div>workspace-client:{documents.length}:{testCases.length}</div>
    </section>
  ),
}));

vi.mock("../../lib/workspace-api", () => ({
  ApiError: WorkspaceApiError,
  listProjectsWithStats: listProjectsWithStatsMock,
  getProject: getWorkspaceProjectMock,
  listProjectDocuments: listWorkspaceProjectDocumentsMock,
  listProjectTestCases: listWorkspaceProjectTestCasesMock,
  listProjectTestCaseDirectories: listProjectTestCaseDirectoriesMock,
}));

vi.mock("../../lib/api", () => ({
  getProject: getProjectMock,
  getRuntimeSettings: getRuntimeSettingsMock,
  createGenerationTask: createGenerationTaskMock,
  listProjectGenerationTasks: listProjectGenerationTasksMock,
  listProjectAutomationSchedules: listProjectAutomationSchedulesMock,
  listProjectEnvironments: listProjectEnvironmentsMock,
  listProjectTestCases: listProjectReviewTestCasesMock,
  addTestCaseReview: addTestCaseReviewMock,
  publishTestCase: publishTestCaseMock,
  updateTestCase: updateTestCaseMock,
}));

import HomePage from "../../app/page";
import ProjectWorkspacePage from "../../app/projects/[projectId]/page";
import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import ProjectGenerationTasksPage from "../../app/projects/[projectId]/generation-tasks/page";
import ProjectReviewPage from "../../app/projects/[projectId]/review/page";
import ProjectTestCasesPage from "../../app/projects/[projectId]/test-cases/page";
import NewTestCasePage from "../../app/projects/[projectId]/test-cases/new/page";
import ProjectAutomationSchedulesPage from "../../app/projects/[projectId]/automation-schedules/page";
import SettingsPage from "../../app/settings/page";

const workspaceProject = {
  id: "1",
  name: "Payments Platform",
  code: "payments",
  description: "Checkout and settlement flows.",
  status: "active",
  defaultProvider: "cursor",
  defaultPromptProfile: "default",
};

describe("workspace pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an unavailable state when the project directory API fails", async () => {
    listProjectsWithStatsMock.mockRejectedValue(
      new WorkspaceApiError("项目目录加载失败", 503),
    );

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("API 不可用");
    expect(html).toContain("项目目录加载失败");
  });

  it("renders the project directory with translated project cards", async () => {
    listProjectsWithStatsMock.mockResolvedValue([
      {
        ...workspaceProject,
        documentCount: 2,
        testCaseCount: 3,
        publishedCount: 1,
      },
    ]);

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("project-directory-toolbar");
    expect(html).toContain("支付平台");
    expect(html).toContain("/projects/1");
    expect(html).not.toContain(">payments<");
  });

  it("renders the project workspace header and wide content shell", async () => {
    getWorkspaceProjectMock.mockResolvedValue(workspaceProject);
    listWorkspaceProjectDocumentsMock.mockResolvedValue([
      {
        id: "doc-1",
        projectId: "1",
        type: "prd",
        name: "Payments PRD",
        sourceMode: "upload",
        sourceUri: "docs/payments-prd.pdf",
      },
      {
        id: "doc-2",
        projectId: "1",
        type: "swagger",
        name: "Payments Swagger",
        sourceMode: "url",
        sourceUri: "https://example.com/swagger.json",
      },
    ]);
    listWorkspaceProjectTestCasesMock.mockResolvedValue([
      {
        id: "case-1",
        projectId: "1",
        title: "Create order with saved card",
        module: "Checkout",
        feature: "Card payment",
        caseType: "functional",
        priority: "high",
        preconditions: ["Saved card exists"],
        steps: [{ text: "Open checkout" }],
        expectedResults: [{ text: "Order completes" }],
        tags: ["smoke"],
        automationFlag: true,
        automationNotes: null,
        uiContext: null,
        status: "draft",
        publishedAt: null,
      },
    ]);

    const html = renderToStaticMarkup(
      await ProjectWorkspacePage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("shell-panel--wide");
    expect(html).toContain("支付平台");
    expect(html).toContain("workspace-client:2:1");
  });

  it("renders an archive banner and restore action for archived projects", async () => {
    getWorkspaceProjectMock.mockResolvedValue({
      ...workspaceProject,
      status: "archived",
    });
    listWorkspaceProjectDocumentsMock.mockResolvedValue([]);
    listWorkspaceProjectTestCasesMock.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await ProjectWorkspacePage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("该项目已归档，可继续查看历史数据。如需继续操作，请先恢复项目。");
    expect(html).toContain("恢复项目");
  });

  it("renders the settings page with runtime configuration", async () => {
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

    expect(html).toContain("shell-panel--wide");
    expect(html).toContain("cursor-agent");
    expect(html).toContain("Cursor/Codex");
    expect(html).toContain("Lark");
    expect(html).toContain("Playwright + TypeScript + POM");
  });

  it("renders generation task history in the current Chinese workspace", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
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
          inputRefs: { document_ids: ["prd-v2", "swagger-checkout"] },
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

    expect(html).toContain("生成队列");
    expect(html).toContain("gpt-4.1-mini");
    expect(html).toContain("gen-101");
    expect(html).toContain("/projects/1/documents");
  });

  it("shows an archive lock on the generation tasks page", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: {
        ...workspaceProject,
        status: "archived",
      },
    });
    listProjectGenerationTasksMock.mockResolvedValue({
      kind: "success",
      tasks: [],
    });

    const html = renderToStaticMarkup(
      await ProjectGenerationTasksPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("项目已归档，请先恢复后再继续操作。");
  });

  it("renders automation schedules with environment and cron details", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
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

    expect(html).toContain("自动化计划");
    expect(html).toContain("Hourly smoke");
    expect(html).toContain("@hourly");
    expect(html).toContain("Payments Staging");
    expect(html).toContain("/projects/1/test-cases");
  });

  it("shows an archive reminder on the automation schedules page", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: {
        ...workspaceProject,
        status: "archived",
      },
    });
    listProjectAutomationSchedulesMock.mockResolvedValue({
      kind: "success",
      items: [],
    });
    listProjectEnvironmentsMock.mockResolvedValue({
      kind: "success",
      environments: [],
    });

    const html = renderToStaticMarkup(
      await ProjectAutomationSchedulesPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("项目已归档，请先恢复后再继续操作。");
  });

  it("renders the test case library and handles generated banner search params", async () => {
    getWorkspaceProjectMock.mockResolvedValue(workspaceProject);
    listWorkspaceProjectDocumentsMock.mockResolvedValue([
      {
        id: "doc-1",
        projectId: "1",
        type: "prd",
        name: "Payments PRD",
        sourceMode: "upload",
        sourceUri: "docs/payments-prd.pdf",
      },
    ]);
    listWorkspaceProjectTestCasesMock.mockResolvedValue([
      {
        id: "case-101",
        projectId: "1",
        directoryId: "11",
        title: "Create order with saved card",
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
        uiContext: null,
        status: "draft",
        publishedAt: null,
      },
    ]);
    listProjectTestCaseDirectoriesMock.mockResolvedValue([
      {
        id: "10",
        projectId: "1",
        name: "测试特性目录",
        parentId: null,
        children: [
          {
            id: "11",
            projectId: "1",
            name: "登录",
            parentId: "10",
            children: [],
          },
        ],
      },
    ]);

    const html = renderToStaticMarkup(
      await ProjectTestCasesPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({ generated: "1" }),
      }),
    );

    expect(html).toContain("支付平台");
    expect(html).toContain("Create order with saved card");
    expect(html).toContain("生成完成");
    expect(html).toContain("/projects/1/test-cases/new");
  });

  it("locks the new test case page for archived projects", async () => {
    getWorkspaceProjectMock.mockResolvedValue({
      ...workspaceProject,
      status: "archived",
    });

    const html = renderToStaticMarkup(
      await NewTestCasePage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("项目已归档，请先恢复后再继续操作。");
    expect(html).not.toContain("创建用例");
  });

  it("renders the review workspace for both empty and selected states", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
    });
    listProjectReviewTestCasesMock.mockResolvedValue({
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

    const emptyHtml = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(emptyHtml).toContain("评审工作台");
    expect(emptyHtml).toContain("未选择测试用例");
    expect(emptyHtml).toContain("/projects/1/test-cases");

    const selectedHtml = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({ caseId: "case-101" }),
      }),
    );

    expect(selectedHtml).toContain("评审草稿");
    expect(selectedHtml).toContain('name="step-1"');
    expect(selectedHtml).toContain("保存草稿");
    expect(selectedHtml).not.toContain("未选择测试用例");
  });

  it("redirects the documents route back to the project overview", async () => {
    await expect(
      ProjectDocumentsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("/projects/1"),
    });
  });
});
