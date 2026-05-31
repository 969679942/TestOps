import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProjectDirectory } from "../../components/project-directory";

vi.mock("../../components/create-project-modal", () => ({
  CreateProjectModal: () => null,
}));

describe("ProjectDirectory", () => {
  it("renders translated project names, archive view toggles, and project actions", () => {
    const html = renderToStaticMarkup(
      <ProjectDirectory
        locale="zh"
        projects={[
          {
            id: "11",
            name: "Quick Commerce Demo 20260527225325",
            code: "quick-commerce-demo-20260527225325",
            description:
              "Demo project created from PRD and Figma input to validate the TestOps flow.",
            status: "active",
            defaultProvider: "cursor",
            defaultPromptProfile: "default",
            documentCount: 1,
            testCaseCount: 0,
            publishedCount: 0,
          },
        ]}
        archivedProjects={[
          {
            id: "12",
            name: "Payments Platform",
            code: "payments",
            description: "Checkout and settlement flows.",
            status: "archived",
            defaultProvider: "cursor",
            defaultPromptProfile: "default",
            documentCount: 3,
            testCaseCount: 8,
            publishedCount: 5,
          },
        ]}
      />,
    );

    expect(html).toContain("即时零售演示项目 20260527225325");
    expect(html).toContain("由 PRD 和 Figma 输入创建的演示项目，用于验证 TestOps 流程。");
    expect(html).toContain("进行中项目");
    expect(html).toContain("已归档项目");
    expect(html).toContain("归档项目");
    expect(html).toContain("project-directory-toolbar");
    expect(html).toContain("project-card-header");
    expect(html).toContain("project-card-summary");
    expect(html).toContain("project-card-stat");
    expect(html).toContain("进入项目工作区");
  });
});
