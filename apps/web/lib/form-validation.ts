import type { TestCaseDraft } from "./ui-automation-case";

export type CreateProjectFieldErrors = {
  name?: string;
};

export type TestCaseFieldErrors = {
  title?: string;
  feature?: string;
  module?: string;
  caseType?: string;
  priority?: string;
  steps?: string;
  expectedResults?: string;
  stepTargetIndexes?: number[];
  expectedResultIndexes?: number[];
};

export function validateCreateProjectForm(name: string): CreateProjectFieldErrors {
  const trimmed = name.trim();
  return trimmed ? {} : { name: "请填写项目名称。" };
}

export function validateTestCaseDraft(draft: TestCaseDraft): TestCaseFieldErrors {
  const errors: TestCaseFieldErrors = {};

  if (!draft.title.trim()) {
    errors.title = "请填写用例名称。";
  }

  if (!draft.feature.trim()) {
    errors.feature = "请填写用例描述。";
  }

  if (!draft.module.trim()) {
    errors.module = "请填写模块。";
  }

  if (!draft.caseType.trim()) {
    errors.caseType = "请选择用例类型。";
  }

  if (!draft.priority.trim()) {
    errors.priority = "请选择用例等级。";
  }

  const stepTargetIndexes = draft.steps
    .map((step, index) => (!step.target.trim() ? index : -1))
    .filter((index) => index >= 0);

  if (draft.steps.length === 0 || stepTargetIndexes.length > 0) {
    errors.steps = "请完善测试步骤。";
    errors.stepTargetIndexes = stepTargetIndexes;
  }

  const expectedResultIndexes = draft.expectedResults
    .map((item, index) => (!item.text.trim() ? index : -1))
    .filter((index) => index >= 0);

  if (draft.expectedResults.length === 0 || expectedResultIndexes.length > 0) {
    errors.expectedResults = "请填写预期结果。";
    errors.expectedResultIndexes = expectedResultIndexes;
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, unknown>) {
  return Object.values(errors).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
}
