import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addTestCaseReview,
  createAutomationGeneration,
  createAutomationDebugProposal,
  createAutomationDebugProposalRerun,
  createAutomationFinalReport,
  createAutomationFailureAnalysis,
  createAutomationRerun,
  createAutomationRun,
  createDocumentVersion,
  createGlobalSkillLibraryItem,
  createGlobalSkillVersion,
  getGlobalSkillLibraryItem,
  createProjectSkillBinding,
  createSkillPackage,
  createSkillPackageVersion,
  createProjectEnvironment,
  createGenerationTask,
  createProjectDocument,
  getProject,
  getRuntimeSettings,
  updateRuntimeSettings,
  listProjectAutomationDebugProposals,
  listProjectAutomationFinalReports,
  listProjectAutomationSchedules,
  listProjectDataSetupExecutions,
  listProjectDataSetupHints,
  listProjectEnvironments,
  listProjectDocuments,
  listProjectAutomationGenerations,
  listProjectAutomationFailureAnalyses,
  listProjectAutomationRuns,
  listProjectAutomationReports,
  listGlobalSkillLibrary,
  listGlobalSkillVersions,
  listProjectSkillBindings,
  listProjectSkillPackages,
  listProjectGenerationTasks,
  listDocumentVersions,
  listSkillPackageVersions,
  listProjectPublishedTestCases,
  listProjects,
  listProjectTestCases,
  parseDocumentVersion,
  publishTestCase,
  publishGlobalSkillVersion,
  rollbackGlobalSkillVersion,
  activateSkillPackageVersion,
  setProjectSkillBindingDefault,
  updateGlobalSkillLibraryItem,
  updateGlobalSkillVersion,
  updateProjectSkillBinding,
  updateProjectEnvironment,
  updateAutomationRun,
  reviewAutomationDebugProposal,
  pushAutomationFinalReportToLark,
  updateTestCase,
} from "../../lib/api";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("api fallbacks", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("keeps a successful empty project list empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(listProjects()).resolves.toEqual({
      kind: "success",
      projects: [],
    });
  });

  it("falls back to demo projects only when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(listProjects()).resolves.toMatchObject({
      kind: "unavailable",
      projects: [{ code: "payments" }, { code: "account-center" }],
    });
  });

  it("distinguishes project list http errors from empty success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "boom" }, 503));

    await expect(listProjects()).resolves.toEqual({
      kind: "http-error",
      status: 503,
    });
  });

  it("returns a not-found result when a project record is missing", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Project not found" }, 404));

    await expect(getProject("999")).resolves.toEqual({
      kind: "not-found",
    });
  });

  it("uses demo content for known projects when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(getProject("payments")).resolves.toMatchObject({
      kind: "unavailable",
      project: {
        code: "payments",
        name: "Payments Platform",
      },
    });
  });

  it("maps known demo project slugs to the live numeric API project ids", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 1,
        name: "Payments Platform",
        code: "payments",
        description: "Checkout and refunds",
        status: "active",
        default_provider: "cursor",
        default_prompt_profile: "default",
      }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    await expect(getProject("payments")).resolves.toMatchObject({
      kind: "success",
      project: {
        id: "1",
        code: "payments",
      },
    });
    await expect(listProjectDocuments("payments")).resolves.toEqual({
      kind: "success",
      documents: [],
    });
    await expect(listProjectTestCases("payments")).resolves.toEqual({
      kind: "success",
      items: [],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:8000/projects/1",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:8000/projects/1/documents",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://127.0.0.1:8000/projects/1/test-cases",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("distinguishes project http errors from missing projects", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "boom" }, 503));

    await expect(getProject("1")).resolves.toEqual({
      kind: "http-error",
      status: 503,
    });
  });

  it("creates, updates, and lists project environments through the API", async () => {
    const environmentResponse = {
      id: 3,
      project_id: 1,
      name: "Payments Staging",
      code: "staging",
      base_url: "https://staging.payments.example",
      api_base_url: "https://api-staging.payments.example",
      auth_profile: "qa-staging",
      status: "active",
      created_at: "2026-05-21T09:00:00Z",
      updated_at: "2026-05-21T09:00:00Z",
    };
    const updatedEnvironmentResponse = {
      ...environmentResponse,
      name: "Payments QA",
      base_url: "https://qa.payments.example",
      api_base_url: "https://api-qa.payments.example",
      status: "paused",
      updated_at: "2026-05-21T09:10:00Z",
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(environmentResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse([environmentResponse]));
    fetchMock.mockResolvedValueOnce(jsonResponse(updatedEnvironmentResponse));

    await expect(
      createProjectEnvironment("1", {
        name: "Payments Staging",
        code: "staging",
        base_url: "https://staging.payments.example",
        api_base_url: "https://api-staging.payments.example",
        auth_profile: "qa-staging",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "3",
        projectId: "1",
        name: "Payments Staging",
        code: "staging",
        baseUrl: "https://staging.payments.example",
        apiBaseUrl: "https://api-staging.payments.example",
        authProfile: "qa-staging",
        status: "active",
      },
    });
    await expect(listProjectEnvironments("1")).resolves.toMatchObject({
      kind: "success",
      environments: [
        {
          id: "3",
          name: "Payments Staging",
        },
      ],
    });
    await expect(
      updateProjectEnvironment("3", {
        name: "Payments QA",
        base_url: "https://qa.payments.example",
        api_base_url: "https://api-qa.payments.example",
        status: "paused",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        name: "Payments QA",
        status: "paused",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/environments",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/environments",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/environments/3",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("maps runtime settings from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        cursor: {
          command: "cursor-agent",
          timeout_seconds: 180,
          cwd: "D:/TestOps",
        },
        codex: {
          failure_analysis_model: "codex-provider-boundary",
        },
        notifications: {
          lark_webhook_configured: false,
        },
        runner: {
          framework: "playwright",
          language: "typescript",
          pattern: "pom",
          reporter: "allure-playwright",
        },
        storage: {
          artifact_root: "var/artifacts",
          document_root: "data/documents",
        },
      }),
    );

    await expect(getRuntimeSettings()).resolves.toEqual({
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
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/settings/runtime",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("fills runtime settings defaults when older API responses omit new sections", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        cursor: {
          command: "cursor-agent",
          timeout_seconds: 180,
          cwd: "D:/TestOps",
        },
        codex: {
          failure_analysis_model: "codex-provider-boundary",
        },
        notifications: {
          lark_webhook_configured: false,
        },
        runner: {
          framework: "playwright",
          language: "typescript",
          pattern: "pom",
          reporter: "allure-playwright",
        },
      }),
    );

    await expect(getRuntimeSettings()).resolves.toEqual({
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
  });

  it("updates runtime settings through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        cursor: {
          command: "cursor-custom",
          timeout_seconds: 240,
          cwd: "D:/Menusifu/TestOps",
        },
        codex: {
          failure_analysis_model: "codex-latest",
        },
        notifications: {
          lark_webhook_configured: false,
        },
        runner: {
          framework: "playwright",
          language: "typescript",
          pattern: "screenplay",
          reporter: "html",
        },
        storage: {
          artifact_root: "var/test-artifacts",
          document_root: "var/test-documents",
        },
      }),
    );

    await expect(
      updateRuntimeSettings({
        cursor: {
          command: "cursor-custom",
          timeoutSeconds: 240,
          cwd: "D:/Menusifu/TestOps",
        },
        codex: {
          failureAnalysisModel: "codex-latest",
        },
        runner: {
          framework: "playwright",
          language: "typescript",
          pattern: "screenplay",
          reporter: "html",
        },
        storage: {
          artifactRoot: "var/test-artifacts",
          documentRoot: "var/test-documents",
        },
      }),
    ).resolves.toEqual({
      kind: "success",
      settings: {
        cursor: {
          command: "cursor-custom",
          timeoutSeconds: 240,
          cwd: "D:/Menusifu/TestOps",
        },
        codex: {
          failureAnalysisModel: "codex-latest",
        },
        notifications: {
          larkWebhookConfigured: false,
        },
        runner: {
          framework: "playwright",
          language: "typescript",
          pattern: "screenplay",
          reporter: "html",
        },
        storage: {
          artifactRoot: "var/test-artifacts",
          documentRoot: "var/test-documents",
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/settings/runtime",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          cursor: {
            command: "cursor-custom",
            timeout_seconds: 240,
            cwd: "D:/Menusifu/TestOps",
          },
          codex: {
            failure_analysis_model: "codex-latest",
          },
          runner: {
            framework: "playwright",
            language: "typescript",
            pattern: "screenplay",
            reporter: "html",
          },
          storage: {
            artifact_root: "var/test-artifacts",
            document_root: "var/test-documents",
          },
        }),
      }),
    );
  });

  it("maps project data setup hints from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 14,
          test_case_id: 22,
          document_version_id: 7,
          environment_id: 3,
          endpoint: "/orders",
          method: "post",
          request_template: {
            customer_id: "{{customer_id}}",
          },
          purpose: "Create order data",
          confidence_score: 0.86,
          status: "ready",
          created_at: "2026-05-21T10:00:00Z",
          updated_at: "2026-05-21T10:00:00Z",
        },
      ]),
    );

    await expect(listProjectDataSetupHints("1")).resolves.toEqual({
      kind: "success",
      hints: [
        {
          id: "14",
          testCaseId: "22",
          documentVersionId: "7",
          environmentId: "3",
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
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/data-setup-hints",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("maps project data setup executions from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 15,
          data_setup_hint_id: 14,
          automation_run_id: 9,
          status: "completed",
          request_summary: {
            method: "post",
            url: "https://api-staging.checkout.example/orders",
            body_keys: ["customer_id"],
          },
          response_summary: {
            status_code: 201,
            json_keys: ["id"],
          },
          error_message: null,
          created_at: "2026-05-21T10:01:00Z",
          completed_at: "2026-05-21T10:01:01Z",
        },
      ]),
    );

    await expect(listProjectDataSetupExecutions("1")).resolves.toEqual({
      kind: "success",
      executions: [
        {
          id: "15",
          dataSetupHintId: "14",
          automationRunId: "9",
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
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/data-setup-executions",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("keeps a successful empty document list empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(listProjectDocuments("1")).resolves.toEqual({
      kind: "success",
      documents: [],
    });
  });

  it("falls back to demo documents only when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(listProjectDocuments("1")).resolves.toMatchObject({
      kind: "unavailable",
      documents: [{ name: "Payments PRD" }, { name: "Checkout API Contract" }],
    });
  });

  it("distinguishes document list http errors from empty success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "boom" }, 502));

    await expect(listProjectDocuments("1")).resolves.toEqual({
      kind: "http-error",
      status: 502,
    });
  });

  it("maps live document parse status fields from the API response", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 7,
          project_id: 1,
          type: "swagger",
          name: "Checkout API",
          source_mode: "url",
          source_uri: "https://example.test/swagger.json",
          parse_status: "parsed",
        },
      ]),
    );

    await expect(listProjectDocuments("1")).resolves.toEqual({
      kind: "success",
      documents: [
        {
          id: "7",
          projectId: "1",
          type: "swagger",
          name: "Checkout API",
          sourceMode: "url",
          sourceUri: "https://example.test/swagger.json",
          parseStatus: "parsed",
        },
      ],
    });
  });

  it("creates a project document through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 7,
        project_id: 1,
        type: "prd",
        name: "Checkout PRD",
        source_mode: "upload",
        source_uri: null,
        parse_status: "uploaded",
      }),
    );

    await expect(
      createProjectDocument("1", {
        type: "prd",
        name: "Checkout PRD",
        source_mode: "upload",
        source_uri: null,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "7",
        name: "Checkout PRD",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/documents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "prd",
          name: "Checkout PRD",
          source_mode: "upload",
          source_uri: null,
        }),
      }),
    );
  });

  it("creates and parses document versions through the API", async () => {
    const versionResponse = {
      id: 12,
      document_asset_id: 7,
      version_no: 1,
      storage_path: "var/artifacts/prd.md",
      checksum: "abc",
      source_uri: null,
      parse_status: "queued",
      parse_summary: null,
      structured_metadata: {},
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(versionResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse(versionResponse));

    await expect(
      createDocumentVersion("7", {
        filename: "prd.md",
        content: "# Checkout",
        source_uri: null,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "12",
        documentAssetId: "7",
        versionNo: 1,
      },
    });
    await expect(parseDocumentVersion("12")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "12",
        parseStatus: "queued",
      },
    });
    fetchMock.mockResolvedValueOnce(jsonResponse([versionResponse]));
    await expect(listDocumentVersions("7")).resolves.toMatchObject({
      kind: "success",
      data: [
        {
          id: "12",
          versionNo: 1,
          parseStatus: "queued",
        },
      ],
    });
  });

  it("creates, lists, versions, and activates skill packages through the API", async () => {
    const packageResponse = {
      id: 21,
      project_id: 1,
      system_key: "payments",
      name: "Payments Skill",
      status: "active",
      active_version_id: null,
      active_version_summary: null,
      created_at: "2026-05-18T09:00:00Z",
      updated_at: "2026-05-18T09:00:00Z",
    };
    const versionResponse = {
      id: 31,
      skill_package_id: 21,
      version_no: 1,
      storage_uri: "oss://skills/payments/v1.zip",
      structured_metadata: { scenario_taxonomy: ["happy_path"] },
      summary: "Payments v1",
      created_at: "2026-05-18T09:01:00Z",
    };
    const activatedResponse = {
      ...packageResponse,
      active_version_id: 31,
      active_version_summary: "Payments v1",
    };

    fetchMock.mockResolvedValueOnce(jsonResponse(packageResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse([packageResponse]));
    fetchMock.mockResolvedValueOnce(jsonResponse(versionResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse([versionResponse]));
    fetchMock.mockResolvedValueOnce(jsonResponse(activatedResponse));

    await expect(
      createSkillPackage("1", {
        system_key: "payments",
        name: "Payments Skill",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "21",
        systemKey: "payments",
      },
    });
    await expect(listProjectSkillPackages("1")).resolves.toMatchObject({
      kind: "success",
      data: [{ id: "21", name: "Payments Skill" }],
    });
    await expect(
      createSkillPackageVersion("21", {
        summary: "Payments v1",
        storage_uri: "oss://skills/payments/v1.zip",
        content: { scenario_taxonomy: ["happy_path"] },
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "31",
        summary: "Payments v1",
        storageUri: "oss://skills/payments/v1.zip",
      },
    });
    await expect(listSkillPackageVersions("21")).resolves.toMatchObject({
      kind: "success",
      data: [{ id: "31", versionNo: 1, storageUri: "oss://skills/payments/v1.zip" }],
    });
    await expect(activateSkillPackageVersion("1", "21", "31")).resolves.toMatchObject({
      kind: "success",
      data: { activeVersionId: "31", activeVersionSummary: "Payments v1" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/skill-packages/21/versions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          summary: "Payments v1",
          storage_uri: "oss://skills/payments/v1.zip",
          content: { scenario_taxonomy: ["happy_path"] },
        }),
      }),
    );
  });

  it("lists global skills and skill versions through the API", async () => {
    const skillResponse = {
      id: 101,
      skill_key: "prd_rules_core",
      name: "PRD + 业务规则主模板",
      description: "Generate evidence-backed cases.",
      category: "core",
      domain: "general",
      input_types: ["prd", "business_rule"],
      status: "active",
      owner: "system",
      current_production_version_id: 201,
      current_production_version_label: "v1 Production",
      created_at: "2026-06-28T10:00:00Z",
      updated_at: "2026-06-28T10:00:00Z",
    };
    const versionResponse = {
      id: 201,
      global_skill_id: 101,
      version_no: 1,
      version_label: "v1 Production",
      status: "production",
      prompt_template: "Generate test cases",
      scenario_taxonomy: ["happy_path", "boundary"],
      review_checklist: ["traceable", "observable"],
      coverage_dimensions: ["core_user_journey"],
      evidence_policy: "Only derive cases from explicit evidence.",
      storage_uri: "seed://skills/prd_rules_core/v1",
      change_log: "Initial version",
      release_notes: "Baseline release",
      created_by: "system",
      created_at: "2026-06-28T10:00:00Z",
      published_at: "2026-06-28T10:00:00Z",
    };

    fetchMock.mockResolvedValueOnce(jsonResponse([skillResponse]));
    fetchMock.mockResolvedValueOnce(jsonResponse(skillResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse([versionResponse]));

    await expect(listGlobalSkillLibrary()).resolves.toMatchObject({
      kind: "success",
      data: [{ id: "101", skillKey: "prd_rules_core", currentProductionVersionLabel: "v1 Production" }],
    });
    await expect(getGlobalSkillLibraryItem("101")).resolves.toMatchObject({
      kind: "success",
      data: { id: "101", name: "PRD + 业务规则主模板" },
    });
    await expect(listGlobalSkillVersions("101")).resolves.toMatchObject({
      kind: "success",
      data: [{ id: "201", versionLabel: "v1 Production", status: "production" }],
    });
  });

  it("creates, updates, and publishes global skills through the API", async () => {
    const createdSkillResponse = {
      id: 102,
      skill_key: "workflow_recovery_plus",
      name: "流程恢复补场景模板",
      description: "Focus on rollback and async recovery.",
      category: "extension",
      domain: "general",
      input_types: ["prd", "business_rule"],
      status: "active",
      owner: "workspace",
      current_production_version_id: null,
      current_production_version_label: null,
      created_at: "2026-06-29T01:00:00Z",
      updated_at: "2026-06-29T01:00:00Z",
    };
    const updatedSkillResponse = {
      ...createdSkillResponse,
      description: "Updated description",
      updated_at: "2026-06-29T01:10:00Z",
    };
    const createdVersionResponse = {
      id: 205,
      global_skill_id: 102,
      version_no: 1,
      version_label: "v1 Draft",
      status: "draft",
      prompt_template: "Generate recovery cases",
      scenario_taxonomy: ["recovery", "rollback"],
      review_checklist: ["traceable"],
      coverage_dimensions: ["exception_flow"],
      evidence_policy: "Only use explicit evidence.",
      storage_uri: "oss://skills/workflow-recovery/v1.zip",
      change_log: "Initial draft",
      release_notes: "Draft release",
      created_by: "workspace",
      created_at: "2026-06-29T01:20:00Z",
      published_at: null,
    };
    const publishedVersionResponse = {
      ...createdVersionResponse,
      status: "production",
      version_label: "v1 Production",
      published_at: "2026-06-29T01:30:00Z",
    };
    const rolledBackVersionResponse = {
      ...publishedVersionResponse,
      version_label: "v1 Rollback Target",
    };

    fetchMock.mockResolvedValueOnce(jsonResponse(createdSkillResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse(updatedSkillResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse(createdVersionResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse(createdVersionResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse(publishedVersionResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse(rolledBackVersionResponse));

    await expect(
      createGlobalSkillLibraryItem({
        skill_key: "workflow_recovery_plus",
        name: "流程恢复补场景模板",
        description: "Focus on rollback and async recovery.",
        category: "extension",
        domain: "general",
        input_types: ["prd", "business_rule"],
        owner: "workspace",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: { id: "102", skillKey: "workflow_recovery_plus" },
    });

    await expect(
      updateGlobalSkillLibraryItem("102", {
        description: "Updated description",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: { description: "Updated description" },
    });

    await expect(
      createGlobalSkillVersion("102", {
        version_label: "v1 Draft",
        prompt_template: "Generate recovery cases",
        scenario_taxonomy: ["recovery", "rollback"],
        review_checklist: ["traceable"],
        coverage_dimensions: ["exception_flow"],
        evidence_policy: "Only use explicit evidence.",
        storage_uri: "oss://skills/workflow-recovery/v1.zip",
        change_log: "Initial draft",
        release_notes: "Draft release",
        created_by: "workspace",
        status: "draft",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: { id: "205", versionLabel: "v1 Draft", status: "draft" },
    });

    await expect(
      updateGlobalSkillVersion("102", "205", {
        version_label: "v1 Draft",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: { id: "205", versionLabel: "v1 Draft" },
    });

    await expect(publishGlobalSkillVersion("102", "205")).resolves.toMatchObject({
      kind: "success",
      data: { id: "205", status: "production", versionLabel: "v1 Production" },
    });
    await expect(rollbackGlobalSkillVersion("102", "205")).resolves.toMatchObject({
      kind: "success",
      data: { id: "205", status: "production", versionLabel: "v1 Rollback Target" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/skills/library/102/versions/205/rollback",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("lists, creates, and updates project skill bindings through the API", async () => {
    const bindingResponse = {
      id: 301,
      project_id: 1,
      global_skill_id: 101,
      global_skill_version_id: 201,
      binding_type: "primary",
      status: "active",
      is_default: true,
      override_payload: {},
      skill_key: "prd_rules_core",
      skill_name: "PRD + 业务规则主模板",
      version_label: "v1 Production",
      version_status: "production",
      skill_category: "core",
      skill_domain: "general",
      input_types: ["prd", "business_rule"],
      created_at: "2026-06-28T10:00:00Z",
      updated_at: "2026-06-28T10:00:00Z",
    };
    const updatedBindingResponse = {
      ...bindingResponse,
      global_skill_version_id: 202,
      version_label: "v2 Candidate",
      is_default: false,
      updated_at: "2026-06-29T02:00:00Z",
    };

    fetchMock.mockResolvedValueOnce(jsonResponse([bindingResponse]));
    fetchMock.mockResolvedValueOnce(jsonResponse(bindingResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse(bindingResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse(updatedBindingResponse));

    await expect(listProjectSkillBindings("1")).resolves.toMatchObject({
      kind: "success",
      data: [{ id: "301", skillName: "PRD + 业务规则主模板", isDefault: true }],
    });
    await expect(
      createProjectSkillBinding("1", {
        global_skill_id: 101,
        binding_type: "primary",
        is_default: true,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: { id: "301", globalSkillId: "101", versionLabel: "v1 Production" },
    });
    await expect(setProjectSkillBindingDefault("1", "301")).resolves.toMatchObject({
      kind: "success",
      data: { id: "301", isDefault: true },
    });
    await expect(
      updateProjectSkillBinding("1", "301", {
        global_skill_version_id: 202,
        is_default: false,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: { id: "301", globalSkillVersionId: "202", versionLabel: "v2 Candidate" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/skill-bindings",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          global_skill_id: 101,
          binding_type: "primary",
          is_default: true,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/skill-bindings/301/set-default",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/skill-bindings/301",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          global_skill_version_id: 202,
          is_default: false,
        }),
      }),
    );
  });

  it("maps generation task responses from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 11,
          project_id: 1,
          status: "failed",
          provider: "cursor",
          model: "gpt-4.1-mini",
          prompt_version: "default",
          input_refs: { document_version_ids: [1, 2], skill_version_id: 31 },
          started_at: null,
          finished_at: "2026-05-18T09:32:00Z",
          error_message: "broker unreachable",
          created_at: "2026-05-18T09:30:00Z",
        },
      ]),
    );

    await expect(listProjectGenerationTasks("1")).resolves.toEqual({
      kind: "success",
      tasks: [
        {
          id: "11",
          projectId: "1",
          status: "failed",
          provider: "cursor",
          model: "gpt-4.1-mini",
          promptVersion: "default",
          inputRefs: { document_version_ids: [1, 2], skill_version_id: 31 },
          startedAt: null,
          finishedAt: "2026-05-18T09:32:00Z",
          errorMessage: "broker unreachable",
          createdAt: "2026-05-18T09:30:00Z",
        },
      ],
    });
  });

  it("creates generation tasks through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 11,
        project_id: 1,
        status: "queued",
        provider: "cursor",
        model: "cursor-default",
        prompt_version: "default",
        input_refs: {
          document_version_ids: [12],
          skill_version_id: 31,
          seed_test_case_ids: [301, 302],
          coverage_gap_note: "补充退款失败后的回滚与告警场景",
        },
        started_at: null,
        finished_at: null,
        error_message: null,
        created_at: "2026-05-18T09:30:00Z",
      }),
    );

    await expect(
      createGenerationTask("1", {
        input_document_version_ids: [12],
        input_skill_version_id: 31,
        seed_test_case_ids: [301, 302],
        coverage_gap_note: "补充退款失败后的回滚与告警场景",
        provider: "cursor",
        model: null,
        prompt_profile: null,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "11",
        provider: "cursor",
        inputRefs: {
          document_version_ids: [12],
          skill_version_id: 31,
          seed_test_case_ids: [301, 302],
          coverage_gap_note: "补充退款失败后的回滚与告警场景",
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/generation-tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          input_document_version_ids: [12],
          input_skill_version_id: 31,
          seed_test_case_ids: [301, 302],
          coverage_gap_note: "补充退款失败后的回滚与告警场景",
          provider: "cursor",
          model: null,
          prompt_profile: null,
        }),
      }),
    );
  });

  it("creates generation tasks with a project skill binding through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 12,
        project_id: 1,
        status: "queued",
        provider: "cursor",
        model: "cursor-default",
        prompt_version: "default",
        input_refs: {
          document_version_ids: [18],
          skill_binding_id: 301,
          global_skill_id: 101,
          global_skill_version_id: 201,
          skill_binding_snapshot: {
            binding_id: 301,
            global_skill_id: 101,
            global_skill_version_id: 201,
            skill_name: "PRD + 业务规则主模板",
            version_label: "v1 Production",
          },
          seed_test_case_ids: [],
          coverage_gap_note: null,
        },
        started_at: null,
        finished_at: null,
        error_message: null,
        created_at: "2026-06-28T10:30:00Z",
      }),
    );

    await expect(
      createGenerationTask("1", {
        input_document_version_ids: [18],
        input_skill_binding_id: 301,
        seed_test_case_ids: [],
        coverage_gap_note: null,
        provider: "cursor",
        model: null,
        prompt_profile: null,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "12",
        inputRefs: {
          document_version_ids: [18],
          skill_binding_id: 301,
          global_skill_id: 101,
          global_skill_version_id: 201,
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/generation-tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          input_document_version_ids: [18],
          input_skill_binding_id: 301,
          seed_test_case_ids: [],
          coverage_gap_note: null,
          provider: "cursor",
          model: null,
          prompt_profile: null,
        }),
      }),
    );
  });

  it("falls back to demo test cases only when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(listProjectTestCases("1")).resolves.toMatchObject({
      kind: "unavailable",
      items: [
        { title: "Create order with saved card" },
        { title: "Decline expired card before capture" },
      ],
    });
  });

  it("maps test case responses from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 21,
          project_id: 1,
          title: "Create order",
          status: "draft",
          module: "Checkout",
          feature: "Card payment",
          case_type: "functional",
          priority: "high",
          preconditions: ["Saved card exists"],
          steps: [{ text: "Open checkout" }],
          expected_results: [{ text: "Order completes" }],
          tags: ["smoke"],
          automation_flag: true,
          automation_notes: "Use checkout fixture",
        },
      ]),
    );

    await expect(listProjectTestCases("1")).resolves.toEqual({
      kind: "success",
      items: [
        {
          id: "21",
          projectId: "1",
          directoryId: null,
          title: "Create order",
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
          automationNotes: "Use checkout fixture",
          uiContext: null,
          linkedRequirement: null,
          sourceRefs: [],
          generationTaskId: null,
          publishedAt: null,
        },
      ],
    });
  });

  it("maps published test case responses from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 22,
          project_id: 1,
          title: "Published checkout case",
          status: "published",
          module: "Checkout",
          feature: "Card payment",
          case_type: "functional",
          priority: "high",
          preconditions: ["Saved card exists"],
          steps: [{ text: "Open checkout" }],
          expected_results: [{ text: "Order completes" }],
          tags: ["smoke"],
          automation_flag: true,
          automation_notes: "Use checkout fixture",
        },
      ]),
    );

    await expect(listProjectPublishedTestCases("1")).resolves.toMatchObject({
      kind: "success",
      items: [
        {
          id: "22",
          status: "published",
          title: "Published checkout case",
        },
      ],
    });
  });

  it("creates automation generations through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 5,
        test_case_id: 22,
        status: "completed",
        framework: "playwright",
        language: "typescript",
        pattern: "pom",
        artifact_root: "var/artifacts/automation",
        artifact_paths: {
          spec: "var/artifacts/automation/tests/published.spec.ts",
          page_object: "var/artifacts/automation/pages/published.page.ts",
        },
        error_message: null,
        created_at: "2026-05-20T10:00:00Z",
        completed_at: "2026-05-20T10:00:01Z",
      }, 201),
    );

    await expect(createAutomationGeneration("22")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "5",
        testCaseId: "22",
        status: "completed",
        artifactPaths: {
          spec: "var/artifacts/automation/tests/published.spec.ts",
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/test-cases/22/automation-generations",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("maps project automation generation history from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 5,
          test_case_id: 22,
          status: "completed",
          framework: "playwright",
          language: "typescript",
          pattern: "pom",
          artifact_root: "var/artifacts/automation",
          artifact_paths: {
            spec: "var/artifacts/automation/tests/published.spec.ts",
            page_object: "var/artifacts/automation/pages/published.page.ts",
          },
          error_message: null,
          created_at: "2026-05-20T10:00:00Z",
          completed_at: "2026-05-20T10:00:01Z",
        },
      ]),
    );

    await expect(listProjectAutomationGenerations("1")).resolves.toMatchObject({
      kind: "success",
      items: [
        {
          id: "5",
          testCaseId: "22",
          status: "completed",
          artifactPaths: {
            spec: "var/artifacts/automation/tests/published.spec.ts",
          },
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/automation-generations",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("maps project automation run history from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 9,
          automation_generation_id: 5,
          status: "queued",
          trigger_mode: "manual",
          report_path: null,
          summary: {},
          error_message: null,
          created_at: "2026-05-20T10:01:00Z",
          started_at: null,
          finished_at: null,
        },
      ]),
    );

    await expect(listProjectAutomationRuns("1")).resolves.toMatchObject({
      kind: "success",
      items: [
        {
          id: "9",
          automationGenerationId: "5",
          status: "queued",
          triggerMode: "manual",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/automation-runs",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("maps project automation reports from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 17,
          automation_run_id: 9,
          kind: "allure",
          artifact_root: "automation/runs/run-9",
          index_path: "automation/runs/run-9/report/index.html",
          summary: {
            passed: 3,
            failed: 1,
            duration_ms: 1240,
          },
          created_at: "2026-05-21T12:00:00Z",
        },
      ]),
    );

    await expect(listProjectAutomationReports("1")).resolves.toEqual({
      kind: "success",
      items: [
        {
          id: "17",
          automationRunId: "9",
          kind: "allure",
          artifactRoot: "automation/runs/run-9",
          indexPath: "automation/runs/run-9/report/index.html",
          summary: {
            passed: 3,
            failed: 1,
            duration_ms: 1240,
          },
          createdAt: "2026-05-21T12:00:00Z",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/automation-reports",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("creates, pushes, and lists automation final reports through the API", async () => {
    const finalReportResponse = {
      id: 41,
      project_id: 1,
      automation_run_id: 9,
      status: "ready",
      title: "Final automation report - Checkout",
      summary: {
        run_status: "failed",
        allure: {
          passed: 3,
          failed: 1,
        },
      },
      content: "# Final automation report",
      lark_status: "pending",
      lark_error: null,
      created_at: "2026-05-21T12:10:00Z",
      pushed_at: null,
    };
    const pushedReportResponse = {
      ...finalReportResponse,
      lark_status: "sent",
      pushed_at: "2026-05-21T12:11:00Z",
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(finalReportResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse(pushedReportResponse));
    fetchMock.mockResolvedValueOnce(jsonResponse([pushedReportResponse]));

    await expect(createAutomationFinalReport("9")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "41",
        automationRunId: "9",
        larkStatus: "pending",
      },
    });
    await expect(pushAutomationFinalReportToLark("41")).resolves.toMatchObject({
      kind: "success",
      data: {
        larkStatus: "sent",
      },
    });
    await expect(listProjectAutomationFinalReports("1")).resolves.toMatchObject({
      kind: "success",
      items: [
        {
          id: "41",
          larkStatus: "sent",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-runs/9/final-report",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-final-reports/41/push-lark",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("maps project automation schedules from the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 31,
          project_id: 1,
          environment_id: 3,
          name: "Hourly smoke",
          target_generation_ids: [5],
          cron_expression: "@hourly",
          status: "active",
          next_run_at: "2026-05-21T10:00:00",
          last_run_at: null,
          created_at: "2026-05-21T09:30:00Z",
          updated_at: "2026-05-21T09:30:00Z",
        },
      ]),
    );

    await expect(listProjectAutomationSchedules("1")).resolves.toEqual({
      kind: "success",
      items: [
        {
          id: "31",
          projectId: "1",
          environmentId: "3",
          name: "Hourly smoke",
          targetGenerationIds: ["5"],
          cronExpression: "@hourly",
          status: "active",
          nextRunAt: "2026-05-21T10:00:00",
          lastRunAt: null,
          createdAt: "2026-05-21T09:30:00Z",
          updatedAt: "2026-05-21T09:30:00Z",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/automation-schedules",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("creates automation run records through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 9,
        automation_generation_id: 5,
        status: "queued",
        trigger_mode: "manual",
        report_path: null,
        summary: {},
        error_message: null,
        created_at: "2026-05-20T10:01:00Z",
        started_at: null,
        finished_at: null,
      }, 201),
    );

    await expect(createAutomationRun("5")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "9",
        automationGenerationId: "5",
        status: "queued",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-generations/5/runs",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("updates automation run results through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 9,
        automation_generation_id: 5,
        status: "failed",
        trigger_mode: "manual",
        report_path: "automation/reports/run-9/index.html",
        summary: {
          passed: 3,
          failed: 1,
          duration_ms: 1240,
        },
        error_message: "Locator timeout",
        created_at: "2026-05-20T10:01:00Z",
        started_at: "2026-05-20T10:01:02Z",
        finished_at: "2026-05-20T10:01:10Z",
      }),
    );

    await expect(
      updateAutomationRun("9", {
        status: "failed",
        report_path: "automation/reports/run-9/index.html",
        summary: {
          passed: 3,
          failed: 1,
          duration_ms: 1240,
        },
        error_message: "Locator timeout",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "9",
        status: "failed",
        reportPath: "automation/reports/run-9/index.html",
        summary: {
          failed: 1,
        },
        errorMessage: "Locator timeout",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-runs/9",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          status: "failed",
          report_path: "automation/reports/run-9/index.html",
          summary: {
            passed: 3,
            failed: 1,
            duration_ms: 1240,
          },
          error_message: "Locator timeout",
        }),
      }),
    );
  });

  it("creates and lists automation failure analyses through the API", async () => {
    const analysisResponse = {
      id: 12,
      automation_run_id: 9,
      status: "completed",
      provider: "codex",
      model: "codex-placeholder",
      classification: "automation_issue",
      confidence: 0.82,
      summary: "Codex placeholder analysis classified a locator timeout.",
      recommendations: ["Inspect the selector", "Rerun after stabilizing the wait"],
      should_rerun: true,
      created_at: "2026-05-21T08:00:00Z",
      completed_at: "2026-05-21T08:00:01Z",
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(analysisResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse([analysisResponse]));

    await expect(createAutomationFailureAnalysis("9")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "12",
        automationRunId: "9",
        classification: "automation_issue",
        shouldRerun: true,
      },
    });
    await expect(listProjectAutomationFailureAnalyses("1")).resolves.toMatchObject({
      kind: "success",
      items: [
        {
          id: "12",
          provider: "codex",
          recommendations: ["Inspect the selector", "Rerun after stabilizing the wait"],
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-runs/9/failure-analyses",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/automation-failure-analyses",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("creates automation reruns from retryable failure analyses through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 10,
        automation_generation_id: 5,
        status: "queued",
        trigger_mode: "analysis_rerun",
        report_path: null,
        summary: {},
        error_message: null,
        created_at: "2026-05-21T08:01:00Z",
        started_at: null,
        finished_at: null,
      }, 201),
    );

    await expect(createAutomationRerun("12")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "10",
        automationGenerationId: "5",
        status: "queued",
        triggerMode: "analysis_rerun",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-failure-analyses/12/rerun",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("creates, reviews, reruns, and lists automation debug proposals through the API", async () => {
    const proposalResponse = {
      id: 21,
      automation_failure_analysis_id: 12,
      status: "draft",
      proposal_type: "patch_proposal",
      summary: "Manual review required before rerun.",
      patch_proposal: {
        manual_review_required: true,
      },
      recommendations: ["Stabilize the submit button locator."],
      reviewer_id: null,
      review_comment: null,
      created_at: "2026-05-21T08:02:00Z",
      reviewed_at: null,
    };
    const approvedResponse = {
      ...proposalResponse,
      status: "approved",
      reviewer_id: "web.reviewer",
      review_comment: "Safe to rerun",
      reviewed_at: "2026-05-21T08:03:00Z",
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(proposalResponse, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse(approvedResponse));
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          id: 22,
          automation_generation_id: 5,
          status: "queued",
          trigger_mode: "debug_rerun",
          report_path: null,
          summary: {},
          error_message: null,
          created_at: "2026-05-21T08:04:00Z",
          started_at: null,
          finished_at: null,
        },
        201,
      ),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse([approvedResponse]));

    await expect(createAutomationDebugProposal("12")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "21",
        automationFailureAnalysisId: "12",
        status: "draft",
        patchProposal: {
          manual_review_required: true,
        },
      },
    });
    await expect(
      reviewAutomationDebugProposal("21", {
        action: "approve",
        reviewer_id: "web.reviewer",
        comment: "Safe to rerun",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        status: "approved",
        reviewerId: "web.reviewer",
      },
    });
    await expect(createAutomationDebugProposalRerun("21")).resolves.toMatchObject({
      kind: "success",
      data: {
        triggerMode: "debug_rerun",
      },
    });
    await expect(listProjectAutomationDebugProposals("1")).resolves.toMatchObject({
      kind: "success",
      items: [
        {
          id: "21",
          status: "approved",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-failure-analyses/12/debug-proposals",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-debug-proposals/21/review",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/automation-debug-proposals/21/rerun",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("updates test case drafts through the API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 21,
        project_id: 1,
        title: "Updated checkout case",
        status: "draft",
        module: "Checkout",
        feature: "Card payment",
        case_type: "functional",
        priority: "medium",
        preconditions: ["Saved card exists"],
        steps: [{ text: "Open checkout" }],
        expected_results: [{ text: "Order completes" }],
        tags: ["smoke"],
        automation_flag: false,
        automation_notes: "Needs fixture",
      }),
    );

    await expect(
      updateTestCase("21", {
        title: "Updated checkout case",
        module: "Checkout",
        feature: "Card payment",
        case_type: "functional",
        priority: "medium",
        preconditions: ["Saved card exists"],
        steps: [{ text: "Open checkout" }],
        expected_results: [{ text: "Order completes" }],
        tags: ["smoke"],
        automation_flag: false,
        automation_notes: "Needs fixture",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "21",
        title: "Updated checkout case",
        automationFlag: false,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/test-cases/21",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("adds review actions and publishes test cases through the API", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 31,
        test_case_id: 21,
        reviewer_id: "web.reviewer",
        action: "approve",
        comment: "Approved",
        created_at: "2026-05-20T10:00:00Z",
      }),
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 21,
        project_id: 1,
        title: "Published checkout case",
        status: "published",
        module: "Checkout",
        feature: "Card payment",
        case_type: "functional",
        priority: "high",
        preconditions: ["Saved card exists"],
        steps: [{ text: "Open checkout" }],
        expected_results: [{ text: "Order completes" }],
        tags: ["smoke"],
        automation_flag: true,
        automation_notes: null,
      }),
    );

    await expect(
      addTestCaseReview("21", {
        reviewer_id: "web.reviewer",
        action: "approve",
        comment: "Approved",
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        action: "approve",
        reviewer_id: "web.reviewer",
      },
    });
    await expect(publishTestCase("21")).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "21",
        status: "published",
      },
    });
  });
});
