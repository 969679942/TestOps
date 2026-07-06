import { describe, expect, it } from "vitest";

import {
  mapProjectCreateError,
  mapProjectDeleteError,
  mapProjectStatusUpdateError,
  parseApiErrorMessage,
  translateKnownApiMessage,
} from "../../lib/api-errors";

describe("api-errors", () => {
  it("parses string detail from FastAPI responses", () => {
    expect(parseApiErrorMessage({ detail: "Project with this name or code already exists" })).toBe(
      "Project with this name or code already exists",
    );
  });

  it("maps project create conflict to a friendly message", () => {
    expect(mapProjectCreateError(409, "Project with this name or code already exists")).toBe(
      "项目名称或项目代号已存在，请换一个名称。",
    );
  });

  it("maps delete active project conflict to a friendly message", () => {
    expect(mapProjectDeleteError(409, "Archive the project before deleting it")).toBe(
      "请先归档项目，再执行删除。",
    );
  });

  it("maps server errors during delete to a migration hint", () => {
    expect(mapProjectDeleteError(500)).toContain("数据库结构可能未更新");
  });

  it("maps archive failures to a friendly message", () => {
    expect(mapProjectStatusUpdateError(404, "Project not found", "archived")).toBe(
      "项目不存在或已被删除。",
    );
  });

  it("translates known backend messages", () => {
    expect(translateKnownApiMessage("Project is archived. Restore it before making changes.")).toBe(
      "项目已归档，请先恢复后再继续操作。",
    );
  });
});
