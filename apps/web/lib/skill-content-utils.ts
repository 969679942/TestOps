const DEFAULT_SKILL_NAME = "未命名 Skill";
const DEFAULT_OWNER = "workspace";
const DEFAULT_CATEGORY = "core";
const DEFAULT_DOMAIN = "general";

export function truncateSkillPreview(text: string, maxLength = 120): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}

export function isMeaningfulSkillDescription(description: string): boolean {
  return description.trim().length > 0;
}

export function isDefaultSkillName(name: string): boolean {
  return name.trim() === DEFAULT_SKILL_NAME;
}

export function shouldShowSkillCategory(category: string): boolean {
  return category.trim() !== "" && category !== DEFAULT_CATEGORY;
}

export function shouldShowSkillDomain(domain: string): boolean {
  return domain.trim() !== "" && domain !== DEFAULT_DOMAIN;
}

export function shouldShowSkillOwner(owner: string): boolean {
  return owner.trim() !== "" && owner !== DEFAULT_OWNER && owner !== "system";
}

export function hasSkillTokenValues(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

export function isMeaningfulSkillText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export const DEFAULT_SKILL_EVIDENCE_POLICY =
  "仅依据明确需求、规则、契约或界面证据推导用例，歧义处标记待确认。";

export const DEFAULT_SKILL_PROMPT_TEMPLATE = "在此编写基于证据的测试提示词。";
