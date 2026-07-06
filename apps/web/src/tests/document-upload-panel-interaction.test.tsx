// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocumentUploadPanel } from "../../components/document-upload-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("../../lib/workspace-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/workspace-api")>();
  return {
    ...actual,
    createProjectDocument: vi.fn(),
    deleteProjectDocument: vi.fn(),
    uploadProjectDocument: vi.fn(),
  };
});

describe("DocumentUploadPanel interactions", () => {
  it("uses the shared confirmation modal before deleting a document", () => {
    render(
      <DocumentUploadPanel
        projectId="1"
        documents={[
          {
            id: "doc-1",
            projectId: "1",
            type: "prd",
            name: "Payments PRD",
            sourceMode: "upload",
            sourceUri: "docs/payments-prd.pdf",
            parseStatus: "parsed",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除 Payments PRD" }));

    expect(screen.getByRole("dialog", { name: "确认删除文档？" })).toBeTruthy();
    expect(
      screen.getByText("确认删除文档「Payments PRD」吗？删除后将影响关联生成任务追溯。"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "确认删除" })).toBeTruthy();
  });
});
