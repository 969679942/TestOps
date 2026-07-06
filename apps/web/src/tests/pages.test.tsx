import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  WorkspaceApiError,
  listProjectsWithStatsMock,
  getWorkspaceProjectMock,
  getProjectWorkspaceMock,
  listWorkspaceProjectDocumentsMock,
  listWorkspaceProjectTestCasesMock,
  listProjectTestCaseDirectoriesMock,
  getProjectMock,
  getRuntimeSettingsMock,
  createGenerationTaskMock,
  listDocumentVersionsMock,
  listProjectDocumentsApiMock,
  listProjectGenerationTasksMock,
  listProjectSkillPackagesMock,
  listProjectSkillBindingsMock,
  listSkillPackageVersionsMock,
  listGlobalSkillLibraryMock,
  getGlobalSkillLibraryItemMock,
  listGlobalSkillVersionsMock,
  listGlobalSkillProjectBindingsMock,
  getGlobalSkillUsageStatsMock,
  createGlobalSkillLibraryItemMock,
  createGlobalSkillVersionMock,
  listProjectAutomationSchedulesMock,
  listProjectEnvironmentsMock,
  listProjectReviewTestCasesMock,
  addTestCaseReviewMock,
  activateSkillPackageVersionMock,
  createProjectSkillBindingMock,
  createSkillPackageMock,
  createSkillPackageVersionMock,
  publishTestCaseMock,
  publishGlobalSkillVersionMock,
  rollbackGlobalSkillVersionMock,
  setProjectSkillBindingDefaultMock,
  updateGlobalSkillLibraryItemMock,
  updateGlobalSkillVersionMock,
  updateProjectSkillBindingMock,
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
    getProjectWorkspaceMock: vi.fn(),
    listWorkspaceProjectDocumentsMock: vi.fn(),
    listWorkspaceProjectTestCasesMock: vi.fn(),
    listProjectTestCaseDirectoriesMock: vi.fn(),
    getProjectMock: vi.fn(),
    getRuntimeSettingsMock: vi.fn(),
    createGenerationTaskMock: vi.fn(),
    listDocumentVersionsMock: vi.fn(),
    listProjectDocumentsApiMock: vi.fn(),
    listProjectGenerationTasksMock: vi.fn(),
    listProjectSkillPackagesMock: vi.fn(),
    listProjectSkillBindingsMock: vi.fn(),
    listSkillPackageVersionsMock: vi.fn(),
    listGlobalSkillLibraryMock: vi.fn(),
    getGlobalSkillLibraryItemMock: vi.fn(),
    listGlobalSkillVersionsMock: vi.fn(),
    listGlobalSkillProjectBindingsMock: vi.fn(),
    getGlobalSkillUsageStatsMock: vi.fn(),
    createGlobalSkillLibraryItemMock: vi.fn(),
    createGlobalSkillVersionMock: vi.fn(),
    listProjectAutomationSchedulesMock: vi.fn(),
    listProjectEnvironmentsMock: vi.fn(),
    listProjectReviewTestCasesMock: vi.fn(),
    addTestCaseReviewMock: vi.fn(),
    activateSkillPackageVersionMock: vi.fn(),
    createProjectSkillBindingMock: vi.fn(),
    createSkillPackageMock: vi.fn(),
    createSkillPackageVersionMock: vi.fn(),
    publishTestCaseMock: vi.fn(),
    publishGlobalSkillVersionMock: vi.fn(),
    rollbackGlobalSkillVersionMock: vi.fn(),
    setProjectSkillBindingDefaultMock: vi.fn(),
    updateGlobalSkillLibraryItemMock: vi.fn(),
    updateGlobalSkillVersionMock: vi.fn(),
    updateProjectSkillBindingMock: vi.fn(),
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
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("../../components/create-project-modal", () => ({
  CreateProjectModal: () => null,
}));

vi.mock("../../components/settings-editor", () => ({
  SettingsEditor: () => <section className="data-card">settings-editor</section>,
}));

vi.mock("../../components/project-workspace-client", () => ({
  ProjectWorkspaceClient: ({
    documents,
    testCaseCount,
  }: {
    documents: Array<unknown>;
    testCaseCount: number;
  }) => (
    <section className="data-card">
      <div>workspace-client:{documents.length}:{testCaseCount}</div>
    </section>
  ),
}));

vi.mock("../../lib/workspace-api", () => ({
  ApiError: WorkspaceApiError,
  listProjectsWithStats: listProjectsWithStatsMock,
  getProject: getWorkspaceProjectMock,
  getProjectWorkspace: getProjectWorkspaceMock,
  listProjectDocuments: listWorkspaceProjectDocumentsMock,
  listProjectTestCases: listWorkspaceProjectTestCasesMock,
  listProjectTestCaseDirectories: listProjectTestCaseDirectoriesMock,
}));

vi.mock("../../lib/api", () => ({
  getProject: getProjectMock,
  getRuntimeSettings: getRuntimeSettingsMock,
  createGenerationTask: createGenerationTaskMock,
  listDocumentVersions: listDocumentVersionsMock,
  listProjectDocuments: listProjectDocumentsApiMock,
  listProjectGenerationTasks: listProjectGenerationTasksMock,
  listProjectSkillPackages: listProjectSkillPackagesMock,
  listProjectSkillBindings: listProjectSkillBindingsMock,
  listSkillPackageVersions: listSkillPackageVersionsMock,
  listGlobalSkillLibrary: listGlobalSkillLibraryMock,
  getGlobalSkillLibraryItem: getGlobalSkillLibraryItemMock,
  listGlobalSkillVersions: listGlobalSkillVersionsMock,
  listGlobalSkillProjectBindings: listGlobalSkillProjectBindingsMock,
  getGlobalSkillUsageStats: getGlobalSkillUsageStatsMock,
  createGlobalSkillLibraryItem: createGlobalSkillLibraryItemMock,
  createGlobalSkillVersion: createGlobalSkillVersionMock,
  listProjectAutomationSchedules: listProjectAutomationSchedulesMock,
  listProjectEnvironments: listProjectEnvironmentsMock,
  listProjectTestCases: listProjectReviewTestCasesMock,
  addTestCaseReview: addTestCaseReviewMock,
  activateSkillPackageVersion: activateSkillPackageVersionMock,
  createProjectSkillBinding: createProjectSkillBindingMock,
  createSkillPackage: createSkillPackageMock,
  createSkillPackageVersion: createSkillPackageVersionMock,
  publishTestCase: publishTestCaseMock,
  publishGlobalSkillVersion: publishGlobalSkillVersionMock,
  rollbackGlobalSkillVersion: rollbackGlobalSkillVersionMock,
  setProjectSkillBindingDefault: setProjectSkillBindingDefaultMock,
  updateGlobalSkillLibraryItem: updateGlobalSkillLibraryItemMock,
  updateGlobalSkillVersion: updateGlobalSkillVersionMock,
  updateProjectSkillBinding: updateProjectSkillBindingMock,
  updateTestCase: updateTestCaseMock,
}));

import HomePage from "../../app/page";
import ProjectWorkspacePage from "../../app/projects/[projectId]/page";
import ProjectDocumentsPage from "../../app/projects/[projectId]/documents/page";
import ProjectGenerationTasksPage from "../../app/projects/[projectId]/generation-tasks/page";
import ProjectReviewPage from "../../app/projects/[projectId]/review/page";
import ProjectSkillsPage from "../../app/projects/[projectId]/skills/page";
import ProjectTestCasesPage from "../../app/projects/[projectId]/test-cases/page";
import NewTestCasePage from "../../app/projects/[projectId]/test-cases/new/page";
import ProjectAutomationSchedulesPage from "../../app/projects/[projectId]/automation-schedules/page";
import SkillDetailPage from "../../app/skills/[skillId]/page";
import SkillsCenterPage from "../../app/skills/page";
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
    listWorkspaceProjectTestCasesMock.mockResolvedValue([]);
    listProjectGenerationTasksMock.mockResolvedValue({ kind: "success", tasks: [] });
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
    getProjectWorkspaceMock.mockResolvedValue({
      project: {
        ...workspaceProject,
        documentCount: 2,
        testCaseCount: 1,
        publishedCount: 0,
      },
      documents: [
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
      ],
    });

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
    getProjectWorkspaceMock.mockResolvedValue({
      project: {
        ...workspaceProject,
        status: "archived",
        documentCount: 0,
        testCaseCount: 0,
        publishedCount: 0,
      },
      documents: [],
    });

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
      storage: {
        artifactRoot: "var/artifacts",
        documentRoot: "data/documents",
      },
    },
  });

    const html = renderToStaticMarkup(await SettingsPage());

    expect(html).toContain("shell-panel--wide");
    expect(html).toContain("cursor-agent");
    expect(html).toContain("Cursor/Codex");
    expect(html).toContain("通知");
    expect(html).toContain("settings-editor");
  });

  it("renders the global skills center library", async () => {
    listGlobalSkillLibraryMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "101",
          skillKey: "prd_rules_core",
          name: "PRD + 业务规则主模板",
          description: "Generate evidence-backed cases.",
          category: "core",
          domain: "general",
          inputTypes: ["prd", "business_rule"],
          status: "active",
          owner: "system",
          currentProductionVersionId: "201",
          currentProductionVersionLabel: "v1 Production",
          createdAt: "2026-06-28T10:00:00Z",
          updatedAt: "2026-06-28T10:00:00Z",
        },
        {
          id: "102",
          skillKey: "workflow_recovery",
          name: "流程恢复补场景模板",
          description: "Focus on rollback and async recovery.",
          category: "extension",
          domain: "general",
          inputTypes: ["prd", "business_rule"],
          status: "active",
          owner: "workspace",
          currentProductionVersionId: null,
          currentProductionVersionLabel: null,
          createdAt: "2026-06-29T10:00:00Z",
          updatedAt: "2026-06-29T10:30:00Z",
        },
      ],
    });
    listGlobalSkillVersionsMock.mockImplementation(async (skillId: string) => {
      if (skillId === "101") {
        return {
          kind: "success",
          data: [
            {
              id: "201",
              globalSkillId: "101",
              versionNo: 1,
              versionLabel: "v1 Production",
              status: "production",
              promptTemplate: "Generate evidence-backed cases",
              scenarioTaxonomy: ["happy_path", "boundary"],
              reviewChecklist: ["traceable", "observable"],
              coverageDimensions: ["core_user_journey"],
              evidencePolicy: "Only derive cases from explicit evidence.",
              storageUri: "seed://skills/prd_rules_core/v1",
              changeLog: "Baseline",
              releaseNotes: "Production ready",
              createdBy: "system",
              createdAt: "2026-06-28T10:00:00Z",
              publishedAt: "2026-06-28T10:00:00Z",
            },
            {
              id: "202",
              globalSkillId: "101",
              versionNo: 2,
              versionLabel: "v2 Draft",
              status: "draft",
              promptTemplate: "Draft prompt",
              scenarioTaxonomy: ["recovery"],
              reviewChecklist: ["traceable"],
              coverageDimensions: ["exception_flow"],
              evidencePolicy: "Only derive cases from explicit evidence.",
              storageUri: null,
              changeLog: "Draft",
              releaseNotes: "Draft only",
              createdBy: "workspace",
              createdAt: "2026-06-29T10:20:00Z",
              publishedAt: null,
            },
          ],
        };
      }

      return {
        kind: "success",
        data: [
          {
            id: "301",
            globalSkillId: "102",
            versionNo: 1,
            versionLabel: "v1 Draft",
            status: "draft",
            promptTemplate: "Generate recovery cases",
            scenarioTaxonomy: ["rollback"],
            reviewChecklist: ["traceable"],
            coverageDimensions: ["exception_flow"],
            evidencePolicy: "Only derive cases from explicit evidence.",
            storageUri: "oss://skills/workflow_recovery/v1.zip",
            changeLog: "Initial draft",
            releaseNotes: "Draft only",
            createdBy: "workspace",
            createdAt: "2026-06-29T10:30:00Z",
            publishedAt: null,
          },
        ],
      };
    });

    const html = renderToStaticMarkup(await SkillsCenterPage());

    expect(html).toContain("技能中心");
    expect(html).toContain("共享技能库");
    expect(html).toContain("新建 Skill");
    expect(html).toContain("Skill 目录");
    expect(html).toContain("最近更新 · 共 2 个");
    expect(html).toContain("更多筛选");
    expect(html).toContain("导入 Skill");
    expect(html).toContain("已发布 1 个，仅草稿 1 个");
    expect(html).toContain("搜索");
    expect(html).toContain("最近更新优先");
    expect(html).toContain("当前生产版本");
    expect(html).toContain("草稿版本");
    expect(html).toContain("最近更新");
    expect(html).toContain("状态");
    expect(html).toContain("已发布");
    expect(html).toContain("仅草稿");
    expect(html).toContain("PRD + 业务规则主模板");
    expect(html).toContain("流程恢复补场景模板");
    expect(html).toContain("创建首个版本");
    expect(html).toContain("新建版本");
    expect(html).toContain('href="/skills/101/versions/202"');
    expect(html).toContain("编辑");
    expect(html.indexOf("流程恢复补场景模板")).toBeLessThan(html.indexOf("PRD + 业务规则主模板"));
    expect(html).not.toContain("How It Works");
    expect(html).not.toContain("新增版本 / 上传归档地址");
    expect(html).not.toContain("共享 Skill</span><p class=\"summary-value\">");
    expect(html).not.toContain("快速操作");
    expect(html).not.toContain("筛选共享 Skill");
  });

  it("renders the global skill detail page", async () => {
    getGlobalSkillLibraryItemMock.mockResolvedValue({
      kind: "success",
      data: {
        id: "101",
        skillKey: "prd_rules_core",
        name: "PRD + 业务规则主模板",
        description: "Generate evidence-backed cases.",
        category: "core",
        domain: "general",
        inputTypes: ["prd", "business_rule"],
        status: "active",
        owner: "system",
        currentProductionVersionId: "201",
        currentProductionVersionLabel: "v1 Production",
        createdAt: "2026-06-28T10:00:00Z",
        updatedAt: "2026-06-28T10:00:00Z",
      },
    });
    listGlobalSkillVersionsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "200",
          globalSkillId: "101",
          versionNo: 0,
          versionLabel: "v0 Draft",
          status: "draft",
          promptTemplate: "Legacy prompt",
          scenarioTaxonomy: ["legacy"],
          reviewChecklist: ["traceable"],
          coverageDimensions: ["core_user_journey"],
          evidencePolicy: "Only derive cases from explicit evidence.",
          storageUri: "seed://skills/prd_rules_core/v0",
          changeLog: "Legacy draft",
          releaseNotes: "Do not use in production",
          createdBy: "system",
          createdAt: "2026-06-27T10:00:00Z",
          publishedAt: null,
        },
        {
          id: "201",
          globalSkillId: "101",
          versionNo: 1,
          versionLabel: "v1 Production",
          status: "production",
          promptTemplate: "Generate test cases",
          scenarioTaxonomy: ["happy_path", "boundary"],
          reviewChecklist: ["traceable", "observable"],
          coverageDimensions: ["core_user_journey"],
          evidencePolicy: "Only derive cases from explicit evidence.",
          storageUri: "seed://skills/prd_rules_core/v1",
          changeLog: "Initial version",
          releaseNotes: "Baseline release",
          createdBy: "system",
          createdAt: "2026-06-28T10:00:00Z",
          publishedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });
    listGlobalSkillProjectBindingsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          bindingId: "301",
          projectId: "1",
          projectName: "支付平台",
          projectCode: "payments",
          bindingType: "primary",
          isDefault: true,
          globalSkillVersionId: "201",
          versionLabel: "v1 Production",
          versionStatus: "production",
          updatedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });
    getGlobalSkillUsageStatsMock.mockResolvedValue({
      kind: "success",
      data: {
        boundProjectCount: 1,
        generationTaskCount: 3,
        succeededGenerationCount: 2,
        failedGenerationCount: 1,
        latestGenerationAt: "2026-06-28T10:00:00Z",
        draftVersionCount: 1,
        productionVersionLabel: "v1 Production",
      },
    });

    const html = renderToStaticMarkup(
      await SkillDetailPage({
        params: Promise.resolve({ skillId: "101" }),
      }),
    );

    expect(html).toContain("PRD + 业务规则主模板");
    expect(html).toContain("v1 Production");
    expect(html).toContain("Generate test cases");
    expect(html).toContain("正常路径");
    expect(html).toContain("内容预览");
    expect(html).toContain("版本历史");
    expect(html).toContain("项目绑定");
    expect(html).toContain("效果概览");
    expect(html).toContain("设置");
    expect(html).toContain("提示词模板");
    expect(html).toContain("变更说明");
    expect(html).toContain("版本对比");
    expect(html).toContain("支付平台");
    expect(html).toContain("保存设置");
    expect(html).not.toContain("推荐更新方式");
    expect(html).not.toContain("保存版本内容");
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
          inputRefs: {
            document_version_ids: ["101"],
            skill_version_id: "21",
            seed_test_case_ids: ["case-9"],
            coverage_gap_note: "补充退款撤销后的通知链路",
          },
          startedAt: null,
          finishedAt: null,
          errorMessage: null,
          createdAt: "2026-05-18T09:30:00Z",
        },
      ],
    });
    listProjectDocumentsApiMock.mockResolvedValue({
      kind: "success",
      documents: [
        {
          id: "doc-1",
          projectId: "1",
          type: "prd",
          name: "Payments PRD",
          sourceMode: "upload",
          sourceUri: "docs/payments-prd.pdf",
          parseStatus: "parsed",
        },
      ],
    });
    listDocumentVersionsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "101",
          documentAssetId: "doc-1",
          versionNo: 1,
          storagePath: null,
          checksum: null,
          sourceUri: "docs/payments-prd.pdf",
          parseStatus: "queued",
          parseSummary: "1 acceptance criterion",
          structuredMetadata: {},
        },
      ],
    });
    listProjectSkillPackagesMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "pkg-1",
          projectId: "1",
          systemKey: "payments",
          name: "Payments Skill",
          status: "active",
          activeVersionId: "21",
          activeVersionSummary: "Payments v1",
          createdAt: "2026-05-18T09:00:00Z",
          updatedAt: "2026-05-18T09:00:00Z",
        },
      ],
    });
    listProjectSkillBindingsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "binding-1",
          projectId: "1",
          globalSkillId: "101",
          globalSkillVersionId: "201",
          bindingType: "primary",
          status: "active",
          isDefault: true,
          overridePayload: {},
          skillKey: "prd_rules_core",
          skillName: "PRD + 业务规则主模板",
          versionLabel: "v1 Production",
          versionStatus: "production",
          skillCategory: "core",
          skillDomain: "general",
          inputTypes: ["prd", "business_rule"],
          createdAt: "2026-06-28T10:00:00Z",
          updatedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });
    listProjectReviewTestCasesMock.mockResolvedValue({
      kind: "success",
      items: [
        {
          id: "case-9",
          projectId: "1",
          title: "退款失败后发送告警通知",
          status: "draft",
          module: "Refund",
          feature: "Alerting",
          caseType: "functional",
          priority: "medium",
          preconditions: ["退款网关异常"],
          steps: [{ text: "触发退款失败" }],
          expectedResults: [{ text: "发送告警并记录工单" }],
          tags: ["refund"],
          automationFlag: false,
          automationNotes: null,
        },
      ],
    });
    listGlobalSkillLibraryMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "101",
          skillKey: "prd_rules_core",
          name: "PRD + 业务规则主模板",
          description: "Generate evidence-backed cases.",
          category: "core",
          domain: "general",
          inputTypes: ["prd", "business_rule"],
          status: "active",
          owner: "system",
          currentProductionVersionId: "201",
          currentProductionVersionLabel: "v1 Production",
          createdAt: "2026-06-28T10:00:00Z",
          updatedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectGenerationTasksPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({
          documentIds: "doc-1",
        } as { lang?: string; documentIds?: string }),
      }),
    );

    expect(html).toContain("当前项目：支付平台。");
    expect(html).toContain("生成队列");
    expect(html).toContain("生成任务");
    expect(html).toContain("gpt-4.1-mini");
    expect(html).toContain("gen-101");
    expect(html).toContain("快速发起生成");
    expect(html).toContain("已选生成技能");
    expect(html).toContain("PRD + 业务规则主模板");
    expect(html).toContain("高级选项");
    expect(html).toContain("补充覆盖说明");
    expect(html).toContain("退款失败后发送告警通知");
    expect(html).toContain("参考现有用例");
    expect(html).toContain('name="documentVersionId" checked="" value="101"');
    expect(html).toContain("/projects/1/documents");
  });

  it("enables queue generation with platform skills when project has no bindings", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
    });
    listProjectGenerationTasksMock.mockResolvedValue({
      kind: "success",
      tasks: [],
    });
    listProjectDocumentsApiMock.mockResolvedValue({
      kind: "success",
      documents: [
        {
          id: "12",
          projectId: "19",
          type: "prd",
          name: "Checkout PRD",
          sourceMode: "upload",
          sourceUri: "docs/checkout.md",
          parseStatus: "parsed",
        },
      ],
    });
    listDocumentVersionsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "1201",
          documentAssetId: "12",
          versionNo: 1,
          storagePath: null,
          checksum: null,
          sourceUri: "docs/checkout.md",
          parseStatus: "parsed",
          parseSummary: "Ready",
          structuredMetadata: {},
        },
      ],
    });
    listProjectSkillBindingsMock.mockResolvedValue({ kind: "success", data: [] });
    listProjectSkillPackagesMock.mockResolvedValue({ kind: "success", data: [] });
    listGlobalSkillLibraryMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "101",
          skillKey: "prd_rules_core",
          name: "PRD + 业务规则主模板",
          description: "Generate evidence-backed cases.",
          category: "core",
          domain: "general",
          inputTypes: ["prd", "business_rule"],
          status: "active",
          owner: "system",
          currentProductionVersionId: "201",
          currentProductionVersionLabel: "v1 Production",
          createdAt: "2026-06-28T10:00:00Z",
          updatedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });
    listProjectReviewTestCasesMock.mockResolvedValue({ kind: "success", items: [] });

    const html = renderToStaticMarkup(
      await ProjectGenerationTasksPage({
        params: Promise.resolve({ projectId: "19" }),
        searchParams: Promise.resolve({ documentIds: "12" }),
      }),
    );

    expect(html).toContain("平台共享");
    expect(html).toContain('name="globalSkillId"');
    expect(html).toContain("排队生成");
    expect(html).not.toContain('type="submit" disabled');
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
    listProjectDocumentsApiMock.mockResolvedValue({
      kind: "success",
      documents: [],
    });
    listProjectSkillBindingsMock.mockResolvedValue({
      kind: "success",
      data: [],
    });
    listProjectSkillPackagesMock.mockResolvedValue({
      kind: "success",
      data: [],
    });
    listGlobalSkillLibraryMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "101",
          skillKey: "prd_rules_core",
          name: "PRD + 业务规则主模板",
          description: "Generate evidence-backed cases.",
          category: "core",
          domain: "general",
          inputTypes: ["prd", "business_rule"],
          status: "active",
          owner: "system",
          currentProductionVersionId: "201",
          currentProductionVersionLabel: "v1 Production",
          createdAt: "2026-06-28T10:00:00Z",
          updatedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectGenerationTasksPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("该项目已归档，可继续查看历史数据。如需继续操作，请先恢复项目。");
    expect(html).not.toContain("排队生成");
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

    expect(html).toContain("当前项目：支付平台。");
    expect(html).toContain("测试用例库");
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

  it("renders the review workspace with a default draft selection and explicit case selection", async () => {
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

    expect(emptyHtml).toContain("当前项目：支付平台。");
    expect(emptyHtml).toContain("评审工作台");
    expect(emptyHtml).toContain("评审草稿");
    expect(emptyHtml).toContain("Create order with saved card");
    expect(emptyHtml).toContain("/projects/1/review?caseId=case-101");

    const selectedHtml = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({ caseId: "case-101" }),
      }),
    );

    expect(selectedHtml).toContain("评审草稿");
    expect(selectedHtml).toContain('name="step-1"');
    expect(selectedHtml).toContain("保存草稿");
    expect(selectedHtml).toContain("退回修改");
    expect(selectedHtml).toContain("驳回");
    expect(selectedHtml).toContain('name="reviewComment"');
    expect(selectedHtml).not.toContain("未选择测试用例");
  });

  it("renders an empty review state when no reviewable test cases are available", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
    });
    listProjectReviewTestCasesMock.mockResolvedValue({
      kind: "success",
      items: [],
    });

    const html = renderToStaticMarkup(
      await ProjectReviewPage({
        params: Promise.resolve({ projectId: "1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("未选择测试用例");
    expect(html).toContain("/projects/1/test-cases");
  });

  it("renders the documents route with version summaries", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
    });
    listProjectDocumentsApiMock.mockResolvedValue({
      kind: "success",
      documents: [
        {
          id: "doc-1",
          projectId: "1",
          type: "prd",
          name: "Payments PRD",
          sourceMode: "upload",
          sourceUri: "docs/payments-prd.pdf",
          parseStatus: "parsed",
        },
      ],
    });
    listDocumentVersionsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "101",
          documentAssetId: "doc-1",
          versionNo: 1,
          storagePath: null,
          checksum: null,
          sourceUri: "docs/payments-prd.pdf",
          parseStatus: "parsed",
          parseSummary: "1 acceptance criterion",
          structuredMetadata: {},
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectDocumentsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("当前项目：支付平台。");
    expect(html).toContain("Document Center");
    expect(html).toContain("文档中心");
    expect(html).toContain("1 acceptance criterion");
    expect(html).toContain("Payments PRD");
    expect(html).toContain("上传需求与接口资料");
    expect(html).toContain("添加文档");
  });

  it("renders archived documents as read-only without upload actions", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: {
        ...workspaceProject,
        status: "archived",
      },
    });
    listProjectDocumentsApiMock.mockResolvedValue({
      kind: "success",
      documents: [],
    });

    const html = renderToStaticMarkup(
      await ProjectDocumentsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("该项目已归档，可继续查看历史数据。如需继续操作，请先恢复项目。");
    expect(html).not.toContain("添加文档");
  });

  it("renders the skill packages page with active version info", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: workspaceProject,
    });
    listProjectSkillPackagesMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "pkg-1",
          projectId: "1",
          systemKey: "payments",
          name: "Payments Skill",
          status: "active",
          activeVersionId: "21",
          activeVersionSummary: "Payments v1",
          createdAt: "2026-05-18T09:00:00Z",
          updatedAt: "2026-05-18T09:00:00Z",
        },
      ],
    });
    listProjectSkillBindingsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "binding-1",
          projectId: "1",
          globalSkillId: "101",
          globalSkillVersionId: "201",
          bindingType: "primary",
          status: "active",
          isDefault: true,
          overridePayload: {},
          skillKey: "prd_rules_core",
          skillName: "PRD + 业务规则主模板",
          versionLabel: "v1 Production",
          versionStatus: "production",
          skillCategory: "core",
          skillDomain: "general",
          inputTypes: ["prd", "business_rule"],
          createdAt: "2026-06-28T10:00:00Z",
          updatedAt: "2026-06-28T10:00:00Z",
        },
      ],
    });
    listSkillPackageVersionsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "21",
          skillPackageId: "pkg-1",
          versionNo: 1,
          storageUri: "oss://skills/payments/v1.zip",
          structuredMetadata: { scenario_taxonomy: ["happy_path"] },
          summary: "Payments v1",
          createdAt: "2026-05-18T09:00:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectSkillsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("当前项目：支付平台。");
    expect(html).toContain("项目技能");
    expect(html).toContain("统一技能中心");
    expect(html).toContain("统一技能中心");
    expect(html).toContain('href="/skills"');
    expect(html).toContain("当前项目默认技能");
    expect(html).toContain("绑定共享技能");
    expect(html).toContain("PRD + 业务规则主模板");
    expect(html).toContain("查看共享技能详情");
    expect(html).toContain("切换绑定版本");
    expect(html).toContain("更新绑定版本");
    expect(html).toContain("切换后设为默认");
    expect(html).toContain(">v0 Draft · draft<");
    expect(html).toContain(">v1 Production · production<");
    expect(html).toContain("兼容模式");
    expect(html).toContain("Payments Skill");
    expect(html).toContain("Payments v1");
    expect(html).toContain("Archive URI");
    expect(html).toContain("oss://skills/payments/v1.zip");
    expect(html).not.toContain("推荐生成模板");
  });

  it("renders archived skill packages as read-only", async () => {
    getProjectMock.mockResolvedValue({
      kind: "success",
      project: {
        ...workspaceProject,
        status: "archived",
      },
    });
    listProjectSkillPackagesMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "pkg-1",
          projectId: "1",
          systemKey: "payments",
          name: "Payments Skill",
          status: "active",
          activeVersionId: "21",
          activeVersionSummary: "Payments v1",
          createdAt: "2026-05-18T09:00:00Z",
          updatedAt: "2026-05-18T09:00:00Z",
        },
      ],
    });
    listProjectSkillBindingsMock.mockResolvedValue({
      kind: "success",
      data: [],
    });
    listSkillPackageVersionsMock.mockResolvedValue({
      kind: "success",
      data: [
        {
          id: "21",
          skillPackageId: "pkg-1",
          versionNo: 1,
          storageUri: "oss://skills/payments/v1.zip",
          structuredMetadata: { scenario_taxonomy: ["happy_path"] },
          summary: "Payments v1",
          createdAt: "2026-05-18T09:00:00Z",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await ProjectSkillsPage({
        params: Promise.resolve({ projectId: "1" }),
      }),
    );

    expect(html).toContain("项目已归档");
    expect(html).toContain("Payments Skill");
    expect(html).not.toContain("创建 Package");
    expect(html).not.toContain("添加版本");
    expect(html).not.toContain("设为激活");
  });
});
