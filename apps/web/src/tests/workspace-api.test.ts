import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestCase,
  deleteProject,
  listProjectTestCaseDirectories,
  listProjectsWithStats,
  updateProjectStatus,
  type ProjectStatusFilter,
} from "../../lib/workspace-api";
import { createEmptyTestCaseDraft, serializeDraftForApi } from "../../lib/ui-automation-case";

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

  it("deletes an archived project through the workspace API", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteProject("12")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/12",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("maps test case directory trees from the workspace API", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 10,
          project_id: 1,
          name: "测试特性目录",
          parent_id: null,
          children: [
            {
              id: 11,
              project_id: 1,
              name: "登录",
              parent_id: 10,
              children: [],
            },
          ],
        },
      ]),
    );

    await expect(listProjectTestCaseDirectories("1")).resolves.toEqual([
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

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/test-case-directories",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("serializes directory_id when creating a test case", async () => {
    const draft = createEmptyTestCaseDraft();
    draft.title = "Login with valid credentials";
    draft.module = "Auth";
    draft.feature = "Sign in";
    draft.directoryId = "11";

    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 22,
        project_id: 1,
        title: "Login with valid credentials",
        module: "Auth",
        feature: "Sign in",
        case_type: "functional",
        priority: "high",
        preconditions: ["User account exists"],
        steps: [{ text: "Open the login page" }],
        expected_results: [{ text: "Login form is displayed" }],
        tags: ["smoke"],
        automation_flag: true,
        automation_notes: null,
        directory_id: 11,
        ui_context: null,
        status: "draft",
        published_at: null,
      }),
    );

    await expect(createTestCase("1", serializeDraftForApi(draft))).resolves.toMatchObject({
      id: "22",
      directoryId: "11",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/projects/1/test-cases",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"directory_id":11'),
      }),
    );
  });
});
