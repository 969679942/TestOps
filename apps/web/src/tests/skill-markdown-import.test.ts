import { describe, expect, it } from "vitest";

import {
  parseSkillMarkdownFile,
  serializeSkillImportForApi,
  skillMarkdownImportTemplate,
} from "../../lib/skill-markdown-import";

describe("skill-markdown-import", () => {
  it("parses the bundled template into two skills with content sections", () => {
    const skills = parseSkillMarkdownFile(skillMarkdownImportTemplate);

    expect(skills).toHaveLength(2);
    expect(skills[0]).toMatchObject({
      name: "PRD + 业务规则增强模板",
      skillKey: "prd_rules_enhanced",
      inputTypesList: ["prd", "business_rule"],
    });
    expect(skills[0].promptTemplate).toContain("测试设计专家");
    expect(skills[0].evidencePolicy).toContain("明确的需求");
    expect(skills[1]).toMatchObject({
      name: "API 契约覆盖模板",
      skillKey: "swagger_contract_core",
      inputTypesList: ["swagger"],
    });
  });

  it("serializes parsed records for API import", () => {
    const [skill] = parseSkillMarkdownFile(skillMarkdownImportTemplate);
    expect(serializeSkillImportForApi(skill)).toMatchObject({
      skill_key: "prd_rules_enhanced",
      name: "PRD + 业务规则增强模板",
      input_types: ["prd", "business_rule"],
    });
  });

  it("rejects blocks without name or skill key", () => {
    expect(() =>
      parseSkillMarkdownFile(`
## 提示词模板
Only prompt

## 证据策略
Only evidence
`),
    ).toThrow("缺少「名称」或「Skill 标识」");
  });

  it("rejects more than 20 skills", () => {
    const blocks = Array.from({ length: 21 }, (_, index) => `
名称：Skill ${index + 1}
Skill 标识：skill_${index + 1}

## 提示词模板
Prompt ${index + 1}

## 证据策略
Evidence ${index + 1}
`).join("\n---\n");

    expect(() => parseSkillMarkdownFile(blocks)).toThrow("单次最多导入 20 条 Skill。");
  });

  it("parses Codex-style SKILL.md with YAML frontmatter", () => {
    const codexSkill = `---
name: detailed-test-case-writer
description: Generate concise executable test cases from PRD or XMind.
---

# Detailed Test Case Writer

## Overview

Generate concise, executable test cases from PRD, XMind, or existing test cases.

## Hard Rules

1. Do not hallucinate.
2. Keep steps executable.

## Source Discipline

- If the source clearly defines a rule, write it directly.
- If the source is ambiguous, write 待确认项 instead of inventing behavior.
`;

    const [skill] = parseSkillMarkdownFile(codexSkill);

    expect(skill).toMatchObject({
      name: "Detailed Test Case Writer",
      skillKey: "detailed-test-case-writer",
      description: "Generate concise executable test cases from PRD or XMind.",
      inputTypesList: ["prd"],
    });
    expect(skill.promptTemplate).toContain("Do not hallucinate.");
    expect(skill.evidencePolicy).toContain("If the source clearly defines a rule");
  });
});
