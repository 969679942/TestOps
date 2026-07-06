import {
  createEmptyTestCaseDraft,
  type TestCaseDraft,
  type UIAutomationStep,
} from "./ui-automation-case";

const MAX_IMPORT_CASES = 100;

const FIELD_PATTERNS: Array<{ key: keyof ParsedCaseMeta; pattern: RegExp }> = [
  { key: "caseId", pattern: /^(?:用例编号|编号|Case ID)[：:]\s*(.+)$/i },
  { key: "title", pattern: /^(?:用例标题|标题|Title)[：:]\s*(.+)$/i },
  { key: "modulePath", pattern: /^(?:所属模块|模块|Module)[：:]\s*(.+)$/i },
  { key: "priority", pattern: /^(?:优先级|Priority)[：:]\s*(.+)$/i },
  { key: "tags", pattern: /^(?:标签|Tags?)[：:]\s*(.+)$/i },
  { key: "caseType", pattern: /^(?:用例类型|类型|Case Type)[：:]\s*(.+)$/i },
];

const SECTION_HEADERS: Record<string, ListSection> = {
  前置条件: "preconditions",
  测试步骤: "steps",
  操作步骤: "steps",
  预期结果: "expected",
  期望结果: "expected",
};

type ListSection = "preconditions" | "steps" | "expected";

type ParsedCaseMeta = {
  caseId: string;
  title: string;
  modulePath: string;
  priority: string;
  tags: string;
  caseType: string;
};

type ParsedCaseBlock = ParsedCaseMeta & {
  preconditions: string[];
  steps: string[];
  expected: string[];
};

function splitCaseBlocks(content: string): string[] {
  return content
    .split(/\n---+\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !/^#\s*测试用例导入模板/m.test(block));
}

function parseModuleFeature(raw: string): { module: string; feature: string } {
  const normalized = raw.trim();
  const separators = [" -> ", " → ", " / ", " - ", "—", "–"];

  for (const separator of separators) {
    if (!normalized.includes(separator)) {
      continue;
    }

    const [modulePart, ...rest] = normalized.split(separator);
    const featurePart = rest.join(separator).trim();
    const moduleName = modulePart.trim();

    if (moduleName && featurePart) {
      return { module: moduleName, feature: featurePart };
    }
  }

  return { module: normalized, feature: normalized };
}

function normalizePriority(raw: string): string {
  const value = raw.trim().toLowerCase();

  if (value === "p0" || value === "high" || value === "高") {
    return "high";
  }

  if (value === "p2" || value === "low" || value === "低") {
    return "low";
  }

  return "medium";
}

function parseTags(raw: string, caseId: string): string[] {
  const tags = raw
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (caseId && !tags.includes(caseId)) {
    tags.unshift(caseId);
  }

  return tags;
}

function parseNumberedLine(line: string): string | null {
  const match = line.match(/^\d+(?:\.\d+)?[、.)]\s*(.+)$/);
  return match?.[1]?.trim() ?? null;
}

function detectSectionHeader(line: string): ListSection | null {
  const normalized = line.replace(/[：:]\s*$/, "").trim();

  return SECTION_HEADERS[normalized] ?? null;
}

function parseCaseBlock(block: string, index: number): ParsedCaseBlock {
  const meta: ParsedCaseMeta = {
    caseId: "",
    title: "",
    modulePath: "",
    priority: "",
    tags: "",
    caseType: "",
  };
  const lists: Record<ListSection, string[]> = {
    preconditions: [],
    steps: [],
    expected: [],
  };

  let currentSection: ListSection | "meta" = "meta";

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(">")) {
      continue;
    }

    const section = detectSectionHeader(line);
    if (section) {
      currentSection = section;
      continue;
    }

    if (currentSection === "meta") {
      let matchedField = false;

      for (const { key, pattern } of FIELD_PATTERNS) {
        const match = line.match(pattern);
        if (match?.[1]) {
          meta[key] = match[1].trim();
          matchedField = true;
          break;
        }
      }

      if (matchedField) {
        continue;
      }
    }

    const numbered = parseNumberedLine(line);
    if (numbered && currentSection !== "meta") {
      lists[currentSection].push(numbered);
      continue;
    }

    if (currentSection === "preconditions") {
      lists.preconditions.push(line);
    }
  }

  if (!meta.title.trim()) {
    throw new Error(`第 ${index + 1} 条用例缺少「用例标题」。`);
  }

  if (!meta.modulePath.trim()) {
    throw new Error(`第 ${index + 1} 条用例缺少「所属模块」。`);
  }

  if (lists.steps.length === 0) {
    throw new Error(`第 ${index + 1} 条用例缺少「测试步骤」。`);
  }

  if (lists.expected.length === 0) {
    throw new Error(`第 ${index + 1} 条用例缺少「预期结果」。`);
  }

  return {
    ...meta,
    preconditions: lists.preconditions,
    steps: lists.steps,
    expected: lists.expected,
  };
}

function toAutomationSteps(steps: string[]): UIAutomationStep[] {
  return steps.map((text, index) => ({
    order: index + 1,
    action: "custom",
    target: text,
    text,
  }));
}

function buildDraft(parsed: ParsedCaseBlock): TestCaseDraft {
  const empty = createEmptyTestCaseDraft();
  const { module, feature } = parseModuleFeature(parsed.modulePath);

  return {
    ...empty,
    title: parsed.title.trim(),
    module,
    feature,
    caseType: parsed.caseType.trim() || "functional",
    priority: normalizePriority(parsed.priority || "medium"),
    preconditions: parsed.preconditions,
    steps: toAutomationSteps(parsed.steps),
    expectedResults: parsed.expected.map((text) => ({ text })),
    tags: parseTags(parsed.tags, parsed.caseId),
    automationFlag: false,
    automationNotes: null,
    linkedRequirement: parsed.caseId ? parsed.caseId : "",
    uiContext: {
      ...empty.uiContext,
      baseUrl: "",
      entryPath: "",
      entryReadySelector: "",
      testData: {},
      teardown: "",
    },
  };
}

export function parseTestCaseMarkdownFile(content: string): TestCaseDraft[] {
  const normalized = content.replace(/^\uFEFF/, "").trim();

  if (!normalized) {
    throw new Error("文件内容为空，请填写至少 1 条用例。");
  }

  const blocks = splitCaseBlocks(normalized);

  if (blocks.length === 0) {
    throw new Error("文件中至少需要 1 条用例。");
  }

  if (blocks.length > MAX_IMPORT_CASES) {
    throw new Error("单次最多导入 100 条用例。");
  }

  return blocks.map((block, index) => buildDraft(parseCaseBlock(block, index)));
}

export const testCaseMarkdownImportTemplate = `# 测试用例导入模板

> 多条用例之间用 \`---\` 分隔，单次最多导入 100 条。

---

用例编号：TC-AUTH-001

用例标题：使用有效账号登录并进入首页

所属模块：认证 -> 登录

优先级：P0

标签：smoke, login

前置条件：
1. 测试账号 qa_user 已开通且未锁定
2. 登录页面可正常访问

测试步骤：
1. 打开登录页
2. 输入有效用户名和密码
3. 点击登录按钮

预期结果：
1. 登录表单正常展示
2. 输入框可编辑
3. 成功进入系统首页

---

用例编号：TC-AUTH-002

用例标题：拒绝无效密码登录

所属模块：认证 -> 登录

优先级：P1

标签：negative

前置条件：
1. 测试账号 qa_user 已开通

测试步骤：
1. 打开登录页
2. 输入有效用户名与错误密码
3. 点击登录按钮

预期结果：
1. 页面停留在登录页
2. 展示密码错误提示
`;

export function downloadTestCaseMarkdownTemplate() {
  const blob = new Blob([testCaseMarkdownImportTemplate], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "test-cases-template.md";
  anchor.click();
  URL.revokeObjectURL(url);
}
