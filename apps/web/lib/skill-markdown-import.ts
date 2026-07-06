import {
  DEFAULT_SKILL_EVIDENCE_POLICY,
  DEFAULT_SKILL_PROMPT_TEMPLATE,
} from "./skill-content-utils";

const MAX_IMPORT_SKILLS = 20;

const FIELD_PATTERNS: Array<{ key: keyof ParsedSkillMeta; pattern: RegExp }> = [
  { key: "name", pattern: /^(?:名称|Skill 名称|Name|name)[：:]\s*(.+)$/i },
  {
    key: "skillKey",
    pattern: /^(?:Skill 标识|标识|skill_key|skillKey|skill-key)[：:]\s*(.+)$/i,
  },
  { key: "inputTypes", pattern: /^(?:输入类型|Input Types?)[：:]\s*(.+)$/i },
  { key: "description", pattern: /^(?:描述|Description)[：:]\s*(.+)$/i },
  { key: "category", pattern: /^(?:分类|Category)[：:]\s*(.+)$/i },
  { key: "domain", pattern: /^(?:领域|Domain)[：:]\s*(.+)$/i },
];

const CONTENT_SECTIONS = {
  promptTemplate: /^(?:##\s*)?(?:提示词模板|Prompt Template)[：:]?\s*$/i,
  evidencePolicy:
    /^(?:##\s*)?(?:证据策略|证据要求|Source Discipline|Evidence Policy)[：:]?\s*$/i,
} as const;

type FileFrontmatter = Partial<ParsedSkillMeta>;

type ContentSection = keyof typeof CONTENT_SECTIONS;

type ParsedSkillMeta = {
  name: string;
  skillKey: string;
  inputTypes: string;
  description: string;
  category: string;
  domain: string;
};

export type SkillMarkdownImportRecord = ParsedSkillMeta & {
  inputTypesList: string[];
  promptTemplate: string;
  evidencePolicy: string;
};

const INPUT_TYPE_ALIASES: Record<string, string> = {
  prd: "prd",
  PRD: "prd",
  业务规则: "business_rule",
  business_rule: "business_rule",
  补充资料: "supplement",
  supplement: "supplement",
  swagger: "swagger",
  Swagger: "swagger",
  figma: "figma",
  Figma: "figma",
};

function stripYamlFrontmatter(content: string): { frontmatter: FileFrontmatter; body: string } {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) {
    return { frontmatter: {}, body: content };
  }

  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: FileFrontmatter = {};

  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    const fieldMatch = line.match(/^([\w-]+)\s*[：:]\s*(.*)$/);
    if (!fieldMatch) {
      continue;
    }

    const key = fieldMatch[1].toLowerCase();
    const value = fieldMatch[2].trim();

    if (key === "name") {
      frontmatter.name = value;
    } else if (key === "description") {
      frontmatter.description = value;
    } else if (key === "skill_key" || key === "skillkey" || key === "skill-key") {
      frontmatter.skillKey = value;
    }
  }

  if (!frontmatter.skillKey?.trim() && frontmatter.name?.trim()) {
    frontmatter.skillKey = frontmatter.name;
  }

  return { frontmatter, body: match[2] };
}

function splitSkillBlocks(content: string): string[] {
  return content
    .split(/\n---+\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !/^#\s*Skill 导入模板/m.test(block));
}

function mergeInheritedMeta(meta: ParsedSkillMeta, inherited?: FileFrontmatter) {
  if (!inherited) {
    return;
  }

  if (!meta.name.trim() && inherited.name?.trim()) {
    meta.name = inherited.name.trim();
  }

  if (!meta.skillKey.trim()) {
    meta.skillKey = (inherited.skillKey || inherited.name || "").trim();
  }

  if (!meta.description.trim() && inherited.description?.trim()) {
    meta.description = inherited.description.trim();
  }
}

function applyHeadingDisplayName(meta: ParsedSkillMeta, block: string) {
  const headingMatch = block.match(/^#\s+(.+)$/m);
  if (!headingMatch) {
    return;
  }

  const heading = headingMatch[1].trim();
  const slugLikeName = meta.name.trim().replace(/[_\s]+/g, "-").toLowerCase();
  const currentName = meta.name.trim().toLowerCase();

  if (!meta.name.trim() || currentName === slugLikeName || currentName.includes("-")) {
    meta.name = heading;
  }
}

function normalizeInputTypes(raw: string): string[] {
  const values = raw
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => INPUT_TYPE_ALIASES[item] ?? item.toLowerCase());

  return values.length > 0 ? values : ["prd"];
}

function detectContentSection(line: string): ContentSection | null {
  for (const [key, pattern] of Object.entries(CONTENT_SECTIONS) as Array<
    [ContentSection, RegExp]
  >) {
    if (pattern.test(line.trim())) {
      return key;
    }
  }

  return null;
}

function parseSkillBlock(
  block: string,
  index: number,
  inheritedMeta?: FileFrontmatter,
): SkillMarkdownImportRecord {
  const meta: ParsedSkillMeta = {
    name: "",
    skillKey: "",
    inputTypes: "",
    description: "",
    category: "",
    domain: "",
  };
  const content: Record<ContentSection, string[]> = {
    promptTemplate: [],
    evidencePolicy: [],
  };

  let currentSection: ContentSection | "meta" | "freeform" = "meta";

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith(">")) {
      continue;
    }

    const contentSection = detectContentSection(trimmed);
    if (contentSection) {
      currentSection = contentSection;
      continue;
    }

    if (currentSection === "meta") {
      let matchedField = false;

      for (const { key, pattern } of FIELD_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          meta[key] = match[1].trim();
          matchedField = true;
          break;
        }
      }

      if (matchedField) {
        continue;
      }

      currentSection = "freeform";
    }

    if (currentSection === "freeform") {
      content.promptTemplate.push(line);
      continue;
    }

    if (currentSection !== "meta") {
      content[currentSection].push(line);
    }
  }

  mergeInheritedMeta(meta, inheritedMeta);
  applyHeadingDisplayName(meta, block);

  const promptTemplate = content.promptTemplate.join("\n").trim() || DEFAULT_SKILL_PROMPT_TEMPLATE;
  const evidencePolicy = content.evidencePolicy.join("\n").trim() || DEFAULT_SKILL_EVIDENCE_POLICY;

  if (!meta.name.trim() && !meta.skillKey.trim()) {
    throw new Error(`第 ${index + 1} 条 Skill 缺少「名称」或「Skill 标识」。`);
  }

  return {
    ...meta,
    inputTypesList: normalizeInputTypes(meta.inputTypes),
    promptTemplate,
    evidencePolicy,
  };
}

export function parseSkillMarkdownFile(content: string): SkillMarkdownImportRecord[] {
  const normalized = content.replace(/^\uFEFF/, "").trim();

  if (!normalized) {
    throw new Error("文件内容为空，请填写至少 1 条 Skill。");
  }

  const { frontmatter, body } = stripYamlFrontmatter(normalized);
  const blocks = splitSkillBlocks(body);

  if (blocks.length === 0) {
    throw new Error("文件中至少需要 1 条 Skill。");
  }

  if (blocks.length > MAX_IMPORT_SKILLS) {
    throw new Error(`单次最多导入 ${MAX_IMPORT_SKILLS} 条 Skill。`);
  }

  return blocks.map((block, index) =>
    parseSkillBlock(block, index, index === 0 ? frontmatter : undefined),
  );
}

export const skillMarkdownImportTemplate = `# Skill 导入模板

> 多条 Skill 之间用 \`---\` 分隔，单次最多导入 20 条。

---

名称：PRD + 业务规则增强模板

Skill 标识：prd_rules_enhanced

输入类型：prd, 业务规则

## 提示词模板
你是一名测试设计专家。请基于 PRD 与业务规则生成可追溯的测试用例。
- 每条用例必须标注来源
- 歧义处标记「待确认」
- 步骤可执行、预期可验证

## 证据策略
仅依据明确的需求、规则、契约或界面证据推导用例，禁止臆造未给出的流程。

---

名称：API 契约覆盖模板

Skill 标识：swagger_contract_core

输入类型：swagger

## 提示词模板
基于 Swagger 契约生成接口测试用例，覆盖正常路径、边界值与鉴权失败场景。

## 证据策略
仅使用 OpenAPI 中已声明的路径、参数与响应结构，不补充未定义的字段约束。
`;

export function downloadSkillMarkdownTemplate() {
  const blob = new Blob([skillMarkdownImportTemplate], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "skills-template.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function serializeSkillImportForApi(record: SkillMarkdownImportRecord) {
  return {
    skill_key: record.skillKey,
    name: record.name,
    description: record.description,
    category: record.category,
    domain: record.domain,
    input_types: record.inputTypesList,
    prompt_template: record.promptTemplate,
    evidence_policy: record.evidencePolicy,
  };
}
