import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProject,
  listProjectDocuments,
  listProjectGenerationTasks,
  listProjects,
  listProjectTestCases,
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
});
