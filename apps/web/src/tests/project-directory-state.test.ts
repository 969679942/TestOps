import { describe, expect, it } from "vitest";

import {
  moveProjectBetweenLists,
  prependProject,
  toProjectSummaryRecord,
} from "../../lib/project-directory-state";

describe("project-directory-state", () => {
  it("maps a created project into a zero-count summary record", () => {
    expect(
      toProjectSummaryRecord({
        id: "22",
        name: "New project",
        code: "new-project",
        description: "desc",
        status: "active",
        defaultProvider: "cursor",
        defaultPromptProfile: "default",
      }),
    ).toMatchObject({
      id: "22",
      name: "New project",
      code: "new-project",
      documentCount: 0,
      testCaseCount: 0,
      publishedCount: 0,
    });
  });

  it("prepends a created project and removes stale duplicates", () => {
    expect(
      prependProject(
        [
          {
            id: "11",
            name: "Existing",
            code: "existing",
            description: null,
            status: "active",
            defaultProvider: "cursor",
            defaultPromptProfile: "default",
            documentCount: 1,
            testCaseCount: 1,
            publishedCount: 0,
          },
          {
            id: "22",
            name: "Old copy",
            code: "new-project",
            description: null,
            status: "active",
            defaultProvider: "cursor",
            defaultPromptProfile: "default",
            documentCount: 1,
            testCaseCount: 2,
            publishedCount: 1,
          },
        ],
        {
          id: "22",
          name: "New project",
          code: "new-project",
          description: null,
          status: "active",
          defaultProvider: "cursor",
          defaultPromptProfile: "default",
          documentCount: 0,
          testCaseCount: 0,
          publishedCount: 0,
        },
      ),
    ).toEqual([
      {
        id: "22",
        name: "New project",
        code: "new-project",
        description: null,
        status: "active",
        defaultProvider: "cursor",
        defaultPromptProfile: "default",
        documentCount: 0,
        testCaseCount: 0,
        publishedCount: 0,
      },
      {
        id: "11",
        name: "Existing",
        code: "existing",
        description: null,
        status: "active",
        defaultProvider: "cursor",
        defaultPromptProfile: "default",
        documentCount: 1,
        testCaseCount: 1,
        publishedCount: 0,
      },
    ]);
  });

  it("moves a project from active to archived", () => {
    expect(
      moveProjectBetweenLists(
        [
          {
            id: "11",
            name: "Existing",
            code: "existing",
            description: null,
            status: "active",
            defaultProvider: "cursor",
            defaultPromptProfile: "default",
            documentCount: 1,
            testCaseCount: 1,
            publishedCount: 0,
          },
        ],
        [],
        "11",
        "archived",
      ),
    ).toEqual({
      activeItems: [],
      archivedItems: [
        {
          id: "11",
          name: "Existing",
          code: "existing",
          description: null,
          status: "archived",
          defaultProvider: "cursor",
          defaultPromptProfile: "default",
          documentCount: 1,
          testCaseCount: 1,
          publishedCount: 0,
        },
      ],
    });
  });

  it("moves a project from archived back to active", () => {
    expect(
      moveProjectBetweenLists(
        [],
        [
          {
            id: "11",
            name: "Existing",
            code: "existing",
            description: null,
            status: "archived",
            defaultProvider: "cursor",
            defaultPromptProfile: "default",
            documentCount: 1,
            testCaseCount: 1,
            publishedCount: 0,
          },
        ],
        "11",
        "active",
      ),
    ).toEqual({
      activeItems: [
        {
          id: "11",
          name: "Existing",
          code: "existing",
          description: null,
          status: "active",
          defaultProvider: "cursor",
          defaultPromptProfile: "default",
          documentCount: 1,
          testCaseCount: 1,
          publishedCount: 0,
        },
      ],
      archivedItems: [],
    });
  });
});
