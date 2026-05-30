import type { Locale } from "./i18n";

const exactNameTranslations: Record<string, string> = {
  "Payments Platform": "支付平台",
  Payments: "支付",
  "Core Banking": "核心银行",
};

const exactDescriptionTranslations: Record<string, string> = {
  "Checkout flows.": "结账流程。",
  "Checkout and settlement flows.": "结账与清结算流程。",
  "Demo checkout and payment flows for local development.": "用于本地联调的演示结账与支付流程。",
  "Live API integration check": "线上接口联调检查。",
  "Demo project created from PRD and Figma input to validate the TestOps flow.":
    "由 PRD 和 Figma 输入创建的演示项目，用于验证 TestOps 流程。",
};

export function translateProjectName(name: string, locale: Locale): string {
  if (locale !== "zh") {
    return name;
  }

  const exactMatch = exactNameTranslations[name];
  if (exactMatch) {
    return exactMatch;
  }

  const liveIntegrationMatch = name.match(/^Live Integration\s+(.+)$/i);
  if (liveIntegrationMatch) {
    return `联调项目 ${liveIntegrationMatch[1]}`;
  }

  const quickCommerceMatch = name.match(/^Quick Commerce Demo\s+(.+)$/i);
  if (quickCommerceMatch) {
    return `即时零售演示项目 ${quickCommerceMatch[1]}`;
  }

  return name;
}

export function translateProjectDescription(
  description: string | null | undefined,
  locale: Locale,
): string | null {
  if (!description) {
    return null;
  }

  if (locale !== "zh") {
    return description;
  }

  return exactDescriptionTranslations[description] ?? description;
}
