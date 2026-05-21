import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addTestCaseReview,
  createAutomationGeneration,
  createAutomationFailureAnalysis,
  createAutomationRerun,
  createAutomationRun,
  createDocumentVersion,
  createProjectEnvironment,
  createGenerationTask,
  createProjectDocument,
  getProject,
  listProjectDataSetupExecutions,
  listProjectDataSetupHints,
  listProjectEnvironments,
  listProjectDocuments,
  listProjectAutomationGenerations,
  listProjectAutomationFailureAnalyses,
  listProjectAutomationRuns,
  listProjectGenerationTasks,
  listProjectPublishedTestCases,
  listProjects,
  listProjectTestCases,
  parseDocumentVersion,
  publishTestCase,
  updateProjectEnvironment,
  updateAutomationRun,
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
          input_refs: { document_ids: [1, 2] },
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
          inputRefs: { document_ids: [1, 2] },
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
        input_refs: { document_ids: [7] },
        started_at: null,
        finished_at: null,
        error_message: null,
        created_at: "2026-05-18T09:30:00Z",
      }),
    );

    await expect(
      createGenerationTask("1", {
        input_document_ids: [7],
        provider: "cursor",
        model: null,
        prompt_profile: null,
      }),
    ).resolves.toMatchObject({
      kind: "success",
      data: {
        id: "11",
        provider: "cursor",
        inputRefs: { document_ids: [7] },
      },
    });
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
