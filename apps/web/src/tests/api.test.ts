import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getProject, listProjectDocuments, listProjects } from "../../lib/api";

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

    await expect(listProjects()).resolves.toEqual([]);
  });

  it("falls back to demo projects only when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(listProjects()).resolves.toMatchObject([
      { code: "payments" },
      { code: "account-center" },
    ]);
  });

  it("returns null when a project record is missing", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Project not found" }, 404));

    await expect(getProject("999")).resolves.toBeNull();
  });

  it("uses demo content for known projects when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(getProject("payments")).resolves.toMatchObject({
      code: "payments",
      name: "Payments Platform",
    });
  });

  it("keeps a successful empty document list empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(listProjectDocuments("1")).resolves.toEqual([]);
  });

  it("falls back to demo documents only when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(listProjectDocuments("1")).resolves.toMatchObject([
      { name: "Payments PRD" },
      { name: "Checkout API Contract" },
    ]);
  });
});
