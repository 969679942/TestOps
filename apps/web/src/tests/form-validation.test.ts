import { describe, expect, it } from "vitest";

import {
  hasFieldErrors,
  validateCreateProjectForm,
  validateTestCaseDraft,
} from "../../lib/form-validation";
import { createEmptyTestCaseDraft } from "../../lib/ui-automation-case";

describe("form-validation", () => {
  it("flags an empty project name", () => {
    expect(validateCreateProjectForm("   ")).toEqual({
      name: "请填写项目名称。",
    });
  });

  it("flags required test case fields and empty step content", () => {
    const draft = createEmptyTestCaseDraft();
    draft.title = "";
    draft.module = "";
    draft.feature = "";
    draft.steps[0] = { ...draft.steps[0], target: "" };
    draft.expectedResults[0] = { text: "" };

    const errors = validateTestCaseDraft(draft);

    expect(errors.title).toBe("请填写用例名称。");
    expect(errors.module).toBe("请填写模块。");
    expect(errors.feature).toBe("请填写用例描述。");
    expect(errors.steps).toBe("请完善测试步骤。");
    expect(errors.expectedResults).toBe("请填写预期结果。");
    expect(errors.stepTargetIndexes).toEqual([0]);
    expect(errors.expectedResultIndexes).toEqual([0]);
    expect(hasFieldErrors(errors)).toBe(true);
  });
});
