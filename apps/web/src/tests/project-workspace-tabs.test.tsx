import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProjectWorkspaceTabs } from "../../components/project-workspace-tabs";

vi.mock("../../components/document-upload-panel", () => ({
  DocumentUploadPanel: () => <div>document-upload-panel</div>,
}));

vi.mock("../../components/test-case-import-panel", () => ({
  TestCaseImportPanel: () => <div>test-case-import-panel</div>,
}));

describe("ProjectWorkspaceTabs", () => {
  it("shows an archive lock instead of active workspace actions", () => {
    const html = renderToStaticMarkup(
      <ProjectWorkspaceTabs
        projectId="1"
        documents={[]}
        projectStatus="archived"
      />,
    );

    expect(html).toContain("项目已归档，请先恢复后再继续操作。");
    expect(html).not.toContain("document-upload-panel");
    expect(html).not.toContain("test-case-import-panel");
  });
});
