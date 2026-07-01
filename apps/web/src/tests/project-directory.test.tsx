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
    expect(html).toContain("project-card-status-action");
    expect(html).toContain("project-card-meta-row");
    expect(html).toContain("project-card-title");
    expect(html).toContain('title="即时零售演示项目 20260527225325"');
    expect(html).not.toContain("project-code");
    expect(html).not.toContain('title="quick-commerce-demo-20260527225325"');
    expect(html).toContain("打开工作台");
    expect(html).toContain('href="/projects/11"');
    expect(html).toContain('href="/projects/11/documents"');
    expect(html).toContain('href="/projects/11/skills"');
    expect(html).toContain('href="/projects/11/generation-tasks"');
    expect(html).toContain("上传文档");
    expect(html).toContain("配置 Skills");
    expect(html).toContain("生成用例");
    expect(html).toContain("project-launchpad");
    expect(html).toContain("project-quick-jump");
    expect(html).toContain("搜索项目或模块");
    expect(html).toContain("快捷跳转");
    expect(html).toContain("Ctrl K");
  });

  it("renders archived projects as read-only records with delete instead of favorite actions", () => {
    const html = renderToStaticMarkup(
      <ProjectDirectory
        locale="zh"
        projects={[]}
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

    expect(html).toContain("删除项目");
    expect(html).toContain("归档项目仅支持查看、恢复或删除，恢复后才能继续主链路。");
    expect(html).not.toContain('href="/projects/12/documents"');
    expect(html).not.toContain('href="/projects/12/skills"');
    expect(html).not.toContain('href="/projects/12/generation-tasks"');
    expect(html).not.toContain("已收藏");
    expect(html).not.toContain('aria-pressed="false">收藏</button>');
  });
});
