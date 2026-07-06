import { hasFieldErrors } from "./form-validation";

export type SkillCreateFieldErrors = {
  skillKey?: string;
};

export type SkillSettingsFieldErrors = {
  name?: string;
  inputTypes?: string;
};

export type SkillVersionDraftFieldErrors = {
  promptTemplate?: string;
  evidencePolicy?: string;
};

export type SkillForkDraftFieldErrors = {
  changeLog?: string;
};

function readFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readCommaList(formData: FormData, name: string) {
  return readFormText(formData, name)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildSkillCreatePayload(formData: FormData) {
  const inputTypes = readCommaList(formData, "inputTypes");

  return {
    skill_key: readFormText(formData, "skillKey"),
    name: readFormText(formData, "name"),
    description: readFormText(formData, "description"),
    category: readFormText(formData, "category"),
    domain: readFormText(formData, "domain"),
    input_types: inputTypes.length > 0 ? inputTypes : ["prd"],
    owner: readFormText(formData, "owner"),
  };
}

export function validateSkillCreateForm(formData: FormData): SkillCreateFieldErrors {
  const errors: SkillCreateFieldErrors = {};
  const skillKey = readFormText(formData, "skillKey");

  if (skillKey && !/^[a-zA-Z0-9_]+$/.test(skillKey)) {
    errors.skillKey = "标识仅支持字母、数字与下划线。";
  }

  return errors;
}

export function validateSkillSettingsForm(formData: FormData): SkillSettingsFieldErrors {
  const errors: SkillSettingsFieldErrors = {};
  if (!readFormText(formData, "name")) {
    errors.name = "请填写名称。";
  }
  if (readCommaList(formData, "inputTypes").length === 0) {
    errors.inputTypes = "请至少选择一种输入类型。";
  }
  return errors;
}

export function validateSkillVersionDraftForm(formData: FormData): SkillVersionDraftFieldErrors {
  const errors: SkillVersionDraftFieldErrors = {};
  if (!readFormText(formData, "promptTemplate")) {
    errors.promptTemplate = "请填写提示词模板。";
  }
  if (!readFormText(formData, "evidencePolicy")) {
    errors.evidencePolicy = "请填写证据策略。";
  }
  return errors;
}

export function validateSkillForkDraftForm(formData: FormData): SkillForkDraftFieldErrors {
  const errors: SkillForkDraftFieldErrors = {};
  if (!readFormText(formData, "changeLog")) {
    errors.changeLog = "请填写变更说明。";
  }
  return errors;
}

export { hasFieldErrors };
