import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  listProjectsWithStats,
  updateProjectStatus,
  type ProjectStatusFilter,
} from "../../lib/workspace-api";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("workspace-api project archive helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("requests active project summaries by default", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await listProjectsWithStats();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/project-summaries?status=active",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("passes through an explicit archived project filter", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await listProjectsWithStats("archived" satisfies ProjectStatusFilter);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/project-summaries?status=archived",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("updates a project status to archived", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 12,
        name: "Archived Project",
        code: "archived-project",
        description: null,
        status: "archived",
        default_provider: "cursor",
        default_prompt_profile: "default",
      }),
    );

    await expect(updateProjectStatus("12", "archived")).resolves.toMatchObject({
      id: "12",
      status: "archived",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/12/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      }),
    );
  });
});
