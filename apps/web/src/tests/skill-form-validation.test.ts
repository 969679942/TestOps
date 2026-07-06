import { describe, expect, it } from "vitest";

import {
  buildSkillCreatePayload,
  validateSkillCreateForm,
  validateSkillForkDraftForm,
  validateSkillSettingsForm,
  validateSkillVersionDraftForm,
} from "../../lib/skill-form-validation";

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("skill form validation", () => {
  it("allows creating a skill with only input types selected", () => {
    const errors = validateSkillCreateForm(formData({ inputTypes: "prd" }));
    expect(errors).toEqual({});
  });

  it("validates skill key format only when provided", () => {
    const errors = validateSkillCreateForm(formData({ skillKey: "bad key", inputTypes: "prd" }));
    expect(errors.skillKey).toBeTruthy();
  });

  it("builds a minimal create payload with defaults", () => {
    expect(buildSkillCreatePayload(formData({ inputTypes: "swagger" }))).toEqual({
      skill_key: "",
      name: "",
      description: "",
      category: "",
      domain: "",
      input_types: ["swagger"],
      owner: "",
    });
  });

  it("defaults input types to prd when none selected", () => {
    expect(buildSkillCreatePayload(formData({})).input_types).toEqual(["prd"]);
  });

  it("requires prompt and evidence for version drafts", () => {
    const errors = validateSkillVersionDraftForm(
      formData({
        promptTemplate: "",
        evidencePolicy: "",
      }),
    );
    expect(errors.promptTemplate).toBeTruthy();
    expect(errors.evidencePolicy).toBeTruthy();
  });

  it("requires name when updating skill settings", () => {
    const errors = validateSkillSettingsForm(formData({ name: "", inputTypes: "prd" }));
    expect(errors.name).toBeTruthy();
  });

  it("requires change log when forking from production", () => {
    const errors = validateSkillForkDraftForm(formData({ changeLog: "" }));
    expect(errors.changeLog).toBeTruthy();
  });
});
