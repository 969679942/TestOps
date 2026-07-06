import { formatValue, type Locale } from "./i18n";

const skillCategoryMap: Record<string, string> = {
  core: "核心",
  api: "API",
  workflow: "流程",
  extension: "扩展",
};

const skillDomainMap: Record<string, string> = {
  general: "通用",
  integration: "集成",
  cross_system: "跨系统",
};

const skillStatusMap: Record<string, string> = {
  production: "生产中",
  draft: "草稿",
  active: "启用",
  archived: "已归档",
};

const taxonomyTokenMap: Record<string, string> = {
  happy_path: "正常路径",
  boundary: "边界",
  negative: "异常",
  permission: "权限",
  state_transition: "状态流转",
  data_variation: "数据变体",
  recovery: "恢复",
  contract: "契约",
  validation: "校验",
  auth: "鉴权",
  idempotency: "幂等",
  error_model: "错误模型",
  regression: "回归",
  gap_fill: "缺口补全",
  rollback: "回滚",
  notification: "通知",
  audit: "审计",
  async_consistency: "异步一致性",
  retry_recovery: "重试恢复",
};

const checklistTokenMap: Record<string, string> = {
  traceable: "可追溯",
  "rule-backed": "规则支撑",
  observable: "可观测",
  "single-purpose": "单一目的",
  "automation-ready": "可自动化",
  "contract-cited": "契约引用",
  "response-checkable": "响应可校验",
  "negative-covered": "异常覆盖",
  "api-automation-ready": "API 可自动化",
  "gap-linked": "缺口关联",
  "side-effect-covered": "副作用覆盖",
  "recovery-observable": "恢复可观测",
  "seed-aware": "种子感知",
};

const coverageTokenMap: Record<string, string> = {
  core_user_journey: "核心用户旅程",
  input_validation: "输入校验",
  business_rule_enforcement: "业务规则执行",
  permission_scope: "权限范围",
  state_transition: "状态流转",
  fallback_and_recovery: "降级与恢复",
  request_schema: "请求结构",
  response_schema: "响应结构",
  status_code_matrix: "状态码矩阵",
  auth_and_permission: "鉴权与权限",
  idempotency_and_retry: "幂等与重试",
  downstream_side_effects: "下游副作用",
  retry_and_compensation: "重试与补偿",
  message_and_notification: "消息与通知",
  audit_and_operability: "审计与可运维性",
  exception_flow: "异常流程",
};

export const skillFieldLabels = {
  skillKey: "Skill 标识",
  name: "名称",
  description: "描述",
  category: "分类",
  domain: "领域",
  inputTypes: "输入类型",
  owner: "维护者",
  status: "状态",
  versionLabel: "版本标签",
  versionNo: "版本号",
  storageUri: "归档地址",
  scenarioTaxonomy: "场景分类",
  reviewChecklist: "评审清单",
  coverageDimensions: "覆盖维度",
  evidencePolicy: "证据策略",
  promptTemplate: "提示词模板",
  changeLog: "变更记录",
  releaseNotes: "发布说明",
  createdBy: "创建者",
  publishedAt: "发布时间",
  updatedAt: "最近更新",
  currentProductionVersion: "当前生产版本",
  draftCount: "草稿版本数",
} as const;

export function formatSkillCategory(value: string, locale: Locale = "zh") {
  if (locale !== "zh") {
    return value;
  }
  return skillCategoryMap[value] ?? formatValue(value, locale);
}

export function formatSkillDomain(value: string, locale: Locale = "zh") {
  if (locale !== "zh") {
    return value;
  }
  return skillDomainMap[value] ?? formatValue(value, locale);
}

export function formatSkillStatus(value: string, locale: Locale = "zh") {
  if (locale !== "zh") {
    return value;
  }
  return skillStatusMap[value] ?? formatValue(value, locale);
}

export function formatSkillToken(value: string, locale: Locale = "zh") {
  if (locale !== "zh") {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  return (
    taxonomyTokenMap[normalized] ??
    checklistTokenMap[normalized] ??
    coverageTokenMap[normalized] ??
    formatValue(value, locale)
  );
}

export function formatSkillTokenList(values: string[], locale: Locale = "zh") {
  if (values.length === 0) {
    return locale === "zh" ? "暂无" : "None";
  }
  return values.map((value) => formatSkillToken(value, locale)).join(" / ");
}

export function formatSkillInputTypes(values: string[], locale: Locale = "zh") {
  if (values.length === 0) {
    return locale === "zh" ? "暂无" : "None";
  }
  return values.map((value) => formatValue(value, locale)).join(" / ");
}

export type SkillTokenOption = { value: string; label: string };

function toOptions(map: Record<string, string>): SkillTokenOption[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export const skillCategoryOptions = toOptions(skillCategoryMap);
export const skillDomainOptions = toOptions(skillDomainMap);
export const skillDefinitionStatusOptions: SkillTokenOption[] = [
  { value: "active", label: "启用" },
  { value: "archived", label: "已归档" },
];
export const skillInputTypeOptions: SkillTokenOption[] = [
  { value: "prd", label: "PRD" },
  { value: "business_rule", label: "业务规则" },
  { value: "supplement", label: "补充资料" },
  { value: "swagger", label: "Swagger" },
  { value: "figma", label: "Figma" },
];
export const scenarioTaxonomyOptions = toOptions(taxonomyTokenMap);
export const reviewChecklistOptions = toOptions(checklistTokenMap);
export const coverageDimensionOptions = toOptions(coverageTokenMap);
