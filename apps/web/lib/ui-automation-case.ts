/** UI 自动化用例结构 — 面向 AI 直接生成 Playwright/Selenium 脚本 */

export const UI_AUTOMATION_SCHEMA_VERSION = "ui-automation-v1";

export const UI_STEP_ACTIONS = [
  { value: "navigate", label: "打开页面" },
  { value: "click", label: "点击" },
  { value: "fill", label: "输入文本" },
  { value: "select", label: "选择下拉项" },
  { value: "hover", label: "悬停" },
  { value: "scroll", label: "滚动" },
  { value: "wait", label: "等待" },
  { value: "assert_visible", label: "断言可见" },
  { value: "assert_text", label: "断言文案" },
  { value: "assert_url", label: "断言 URL" },
  { value: "press_key", label: "按键" },
  { value: "upload_file", label: "上传文件" },
  { value: "custom", label: "自定义" },
] as const;

export type UIStepAction = (typeof UI_STEP_ACTIONS)[number]["value"];

export type UIAutomationStep = {
  order?: number;
  action: UIStepAction | string;
  target: string;
  locatorHint?: string;
  value?: string;
  assertion?: string;
  timeoutMs?: number;
  text?: string;
};

export type UIContext = {
  schemaVersion: string;
  framework: string;
  baseUrl: string;
  browser: string;
  viewport: { width: number; height: number };
  entryPath: string;
  entryReadySelector: string;
  testData: Record<string, string>;
  teardown: string;
};

export type TestCaseDraft = {
  title: string;
  module: string;
  feature: string;
  caseType: string;
  priority: string;
  directoryId: string | null;
  owner: string;
  releaseVersion: string;
  iteration: string;
  attachments: string[];
  linkedRequirement: string;
  preconditions: string[];
  steps: UIAutomationStep[];
  expectedResults: { text: string }[];
  tags: string[];
  automationFlag: boolean;
  automationNotes: string | null;
  uiContext: UIContext;
};

export type ImportTestCaseInput = TestCaseDraft;

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      result[key] = String(raw);
    }
  }
  return result;
}

function parseViewport(value: unknown): { width: number; height: number } {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const width = Number(record.width ?? 1280);
    const height = Number(record.height ?? 720);
    return { width: Number.isFinite(width) ? width : 1280, height: Number.isFinite(height) ? height : 720 };
  }
  return { width: 1280, height: 720 };
}

function parseUiContext(record: Record<string, unknown>): UIContext {
  const raw =
    record.ui_context ?? record.uiContext ?? record.environment ?? record.entry ?? null;

  const env =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const entry =
    record.entry && typeof record.entry === "object" && !Array.isArray(record.entry)
      ? (record.entry as Record<string, unknown>)
      : {};

  const legacyEnv =
    record.environment && typeof record.environment === "object" && !Array.isArray(record.environment)
      ? (record.environment as Record<string, unknown>)
      : {};

  const merged = { ...legacyEnv, ...env, ...entry };

  return {
    schemaVersion: String(merged.schema_version ?? merged.schemaVersion ?? UI_AUTOMATION_SCHEMA_VERSION),
    framework: String(merged.framework ?? "playwright"),
    baseUrl: String(merged.base_url ?? merged.baseUrl ?? legacyEnv.base_url ?? ""),
    browser: String(merged.browser ?? legacyEnv.browser ?? "chromium"),
    viewport: parseViewport(merged.viewport ?? legacyEnv.viewport),
    entryPath: String(
      merged.entry_path ?? merged.entryPath ?? entry.url ?? entry.path ?? merged.url ?? "",
    ),
    entryReadySelector: String(
      merged.entry_ready_selector ??
        merged.entryReadySelector ??
        entry.ready_selector ??
        entry.readySelector ??
        "",
    ),
    testData: asRecord(record.test_data ?? record.testData ?? merged.test_data ?? merged.testData),
    teardown: String(merged.teardown ?? ""),
  };
}

function parseStep(raw: unknown, index: number, fieldName: string): UIAutomationStep {
  if (typeof raw === "string" && raw.trim()) {
    return { action: "custom", target: raw.trim(), text: raw.trim() };
  }

  if (!raw || typeof raw !== "object") {
    throw new Error(`${fieldName}[${index}] 格式无效。`);
  }

  const record = raw as Record<string, unknown>;
  const text = String(record.text ?? "").trim();
  const action = String(record.action ?? (text ? "custom" : "")).trim();
  const target = String(record.target ?? text ?? "").trim();

  if (!action || !target) {
    throw new Error(`${fieldName}[${index}] 需要 action+target 或 text。`);
  }

  const step: UIAutomationStep = {
    order: typeof record.order === "number" ? record.order : index + 1,
    action,
    target,
  };

  const locatorHint = String(record.locator_hint ?? record.locatorHint ?? "").trim();
  const value = String(record.value ?? "").trim();
  const assertion = String(record.assertion ?? "").trim();
  const timeoutMs = Number(record.timeout_ms ?? record.timeoutMs);

  if (locatorHint) step.locatorHint = locatorHint;
  if (value) step.value = value;
  if (assertion) step.assertion = assertion;
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) step.timeoutMs = timeoutMs;
  if (text) step.text = text;

  return step;
}

function parseSteps(value: unknown, fieldName: string): UIAutomationStep[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`字段 ${fieldName} 必须是非空数组。`);
  }
  return value.map((item, index) => parseStep(item, index, fieldName));
}

function parseExpected(value: unknown, fieldName: string): { text: string }[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`字段 ${fieldName} 必须是非空数组。`);
  }
  return value.map((item, index) => {
    if (typeof item === "string" && item.trim()) {
      return { text: item.trim() };
    }
    if (item && typeof item === "object" && "text" in item) {
      const text = String((item as { text: unknown }).text ?? "").trim();
      if (text) return { text };
    }
    throw new Error(`${fieldName}[${index}] 需要字符串或 { "text": "..." }。`);
  });
}

export function mapRawCase(raw: unknown, index: number): TestCaseDraft {
  if (!raw || typeof raw !== "object") {
    throw new Error(`第 ${index + 1} 条用例必须是对象。`);
  }

  const record = raw as Record<string, unknown>;
  const title = String(record.title ?? "").trim();
  const moduleName = String(record.module ?? "").trim();
  const feature = String(record.feature ?? "").trim();

  if (!title || !moduleName || !feature) {
    throw new Error(`第 ${index + 1} 条用例缺少 title、module 或 feature。`);
  }

  const uiContext = parseUiContext(record);

  return {
    title,
    module: moduleName,
    feature,
    caseType: String(record.case_type ?? record.caseType ?? "ui_automation").trim(),
    priority: String(record.priority ?? "medium").trim(),
    directoryId:
      record.directory_id === null || record.directoryId === null
        ? null
        : typeof (record.directory_id ?? record.directoryId) === "number" ||
            typeof (record.directory_id ?? record.directoryId) === "string"
          ? String(record.directory_id ?? record.directoryId)
          : null,
    owner: typeof record.owner === "string" ? record.owner : "",
    releaseVersion:
      typeof (record.release_version ?? record.releaseVersion) === "string"
        ? String(record.release_version ?? record.releaseVersion)
        : "",
    iteration: typeof record.iteration === "string" ? record.iteration : "",
    attachments: asStringList(record.attachments),
    linkedRequirement:
      typeof (record.linked_requirement ?? record.linkedRequirement) === "string"
        ? String(record.linked_requirement ?? record.linkedRequirement)
        : "",
    preconditions: asStringList(record.preconditions),
    steps: parseSteps(record.steps, `cases[${index}].steps`),
    expectedResults: parseExpected(
      record.expected_results ?? record.expectedResults,
      `cases[${index}].expected_results`,
    ),
    tags: asStringList(record.tags),
    automationFlag: Boolean(record.automation_flag ?? record.automationFlag ?? true),
    automationNotes:
      typeof (record.automation_notes ?? record.automationNotes) === "string"
        ? String(record.automation_notes ?? record.automationNotes)
        : "Playwright Page Object；优先 data-testid；失败截图+录屏",
    uiContext,
  };
}

export function parseUiAutomationFile(payload: unknown): TestCaseDraft[] {
  let cases: unknown;

  if (Array.isArray(payload)) {
    cases = payload;
  } else if (payload && typeof payload === "object" && "cases" in payload) {
    cases = (payload as { cases: unknown }).cases;
  } else {
    throw new Error('文件格式无效，请使用 { "cases": [...] } 或直接提供用例数组。');
  }

  if (!Array.isArray(cases) || cases.length === 0) {
    throw new Error("文件中至少需要 1 条用例。");
  }

  if (cases.length > 100) {
    throw new Error("单次最多导入 100 条用例。");
  }

  return cases.map((item, index) => mapRawCase(item, index));
}

export function createEmptyTestCaseDraft(): TestCaseDraft {
  return {
    title: "",
    module: "",
    feature: "",
    caseType: "ui_automation",
    priority: "high",
    directoryId: null,
    owner: "",
    releaseVersion: "",
    iteration: "",
    attachments: [],
    linkedRequirement: "",
    preconditions: ["测试环境可访问", "测试账号与数据已准备"],
    steps: [
      {
        order: 1,
        action: "navigate",
        target: "目标页面",
        value: "/",
        locatorHint: "path:/",
        assertion: "页面加载完成",
      },
    ],
    expectedResults: [{ text: "用例执行成功，关键断言全部通过" }],
    tags: ["smoke"],
    automationFlag: true,
    automationNotes: "Playwright + Page Object；优先 data-testid；失败截图",
    uiContext: {
      schemaVersion: UI_AUTOMATION_SCHEMA_VERSION,
      framework: "playwright",
      baseUrl: "https://app.example.com",
      browser: "chromium",
      viewport: { width: 1280, height: 720 },
      entryPath: "/",
      entryReadySelector: "[data-testid='app-root']",
      testData: {},
      teardown: "",
    },
  };
}

export function draftFromTestCase(testCase: {
  title: string;
  module: string;
  feature: string;
  caseType: string;
  priority: string;
  directoryId?: string | null;
  preconditions: string[];
  steps: UIAutomationStep[];
  expectedResults: { text: string }[];
  tags: string[];
  automationFlag: boolean;
  automationNotes: string | null;
  uiContext: UIContext | null;
}): TestCaseDraft {
  const empty = createEmptyTestCaseDraft();
  return {
    title: testCase.title,
    module: testCase.module,
    feature: testCase.feature,
    caseType: testCase.caseType,
    priority: testCase.priority,
    directoryId: testCase.directoryId ?? null,
    owner: empty.owner,
    releaseVersion: empty.releaseVersion,
    iteration: empty.iteration,
    attachments: empty.attachments,
    linkedRequirement: empty.linkedRequirement,
    preconditions: testCase.preconditions.length > 0 ? testCase.preconditions : empty.preconditions,
    steps:
      testCase.steps.length > 0
        ? testCase.steps.map((step, index) => ({
            ...step,
            order: step.order ?? index + 1,
            action: step.action ?? "custom",
            target: step.target ?? step.text ?? "",
          }))
        : empty.steps,
    expectedResults: testCase.expectedResults,
    tags: testCase.tags,
    automationFlag: testCase.automationFlag,
    automationNotes: testCase.automationNotes,
    uiContext: testCase.uiContext ?? empty.uiContext,
  };
}

export function serializeStepForApi(step: UIAutomationStep, index: number) {
  const payload: Record<string, unknown> = {
    order: step.order ?? index + 1,
    action: step.action,
    target: step.target,
  };
  if (step.locatorHint?.trim()) payload.locator_hint = step.locatorHint.trim();
  if (step.value?.trim()) payload.value = step.value.trim();
  if (step.assertion?.trim()) payload.assertion = step.assertion.trim();
  if (step.timeoutMs) payload.timeout_ms = step.timeoutMs;
  return payload;
}

export function serializeDraftForApi(draft: TestCaseDraft) {
  return {
    title: draft.title.trim(),
    module: draft.module.trim(),
    feature: draft.feature.trim(),
    caseType: draft.caseType,
    priority: draft.priority,
    directoryId: draft.directoryId,
    preconditions: draft.preconditions.filter((item) => item.trim()),
    steps: draft.steps.map(serializeStepForApi),
    expectedResults: draft.expectedResults.filter((item) => item.text.trim()),
    tags: draft.tags.filter((item) => item.trim()),
    automationFlag: draft.automationFlag,
    automationNotes: draft.automationNotes,
    uiContext: {
      schema_version: draft.uiContext.schemaVersion,
      framework: draft.uiContext.framework,
      base_url: draft.uiContext.baseUrl || null,
      browser: draft.uiContext.browser,
      viewport: draft.uiContext.viewport,
      entry_path: draft.uiContext.entryPath || null,
      entry_ready_selector: draft.uiContext.entryReadySelector || null,
      test_data: draft.uiContext.testData,
      teardown: draft.uiContext.teardown || null,
    },
  };
}

export const uiAutomationImportTemplate = {
  schema_version: UI_AUTOMATION_SCHEMA_VERSION,
  description:
    "UI 自动化用例模板：结构化步骤 + 定位提示 + 测试数据，可直接交给 AI 生成 Playwright/Selenium 脚本，无需二次补充。",
  cases: [
    {
      title: "使用有效账号登录并进入首页",
      module: "认证",
      feature: "登录",
      case_type: "ui_automation",
      priority: "high",
      tags: ["smoke", "login"],
      automation_flag: true,
      automation_notes:
        "目标框架 Playwright；使用 Page Object；定位优先 data-testid，其次 role+name；断言失败截图+trace",
      preconditions: ["测试账号 qa_user 已开通且未锁定", "登录接口与页面可正常访问"],
      ui_context: {
        framework: "playwright",
        base_url: "https://app.example.com",
        browser: "chromium",
        viewport: { width: 1280, height: 720 },
        entry_path: "/login",
        entry_ready_selector: "[data-testid='login-form']",
        test_data: {
          username: "qa_user@example.com",
          password: "{{vault:qa_password}}",
        },
        teardown: "调用退出接口并清理浏览器 storage",
      },
      steps: [
        {
          order: 1,
          action: "navigate",
          target: "登录页",
          value: "/login",
          locator_hint: "path:/login",
          assertion: "展示登录表单，标题包含「登录」",
        },
        {
          order: 2,
          action: "fill",
          target: "用户名输入框",
          value: "{{test_data.username}}",
          locator_hint: "[data-testid='username'], input[name='username'], #email",
          assertion: "输入框可见且可编辑",
        },
        {
          order: 3,
          action: "fill",
          target: "密码输入框",
          value: "{{test_data.password}}",
          locator_hint: "[data-testid='password'], input[type='password']",
        },
        {
          order: 4,
          action: "click",
          target: "登录提交按钮",
          locator_hint: "[data-testid='login-submit'], button[type='submit']",
          assertion: "触发登录请求",
        },
        {
          order: 5,
          action: "assert_url",
          target: "首页地址",
          value: "/dashboard",
          assertion: "URL 匹配 /dashboard",
        },
        {
          order: 6,
          action: "assert_visible",
          target: "用户头像或欢迎语",
          locator_hint: "[data-testid='user-avatar'], [data-testid='welcome-message']",
          assertion: "展示已登录用户信息",
        },
      ],
      expected_results: [
        { text: "成功进入系统首页" },
        { text: "顶部导航展示当前登录用户" },
      ],
    },
  ],
};

export function downloadUiAutomationTemplate() {
  const blob = new Blob([JSON.stringify(uiAutomationImportTemplate, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ui-automation-cases-template.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
