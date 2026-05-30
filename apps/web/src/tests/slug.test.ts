import { describe, expect, it } from "vitest";

import { slugifyProjectCode } from "../../lib/slug";

describe("slugifyProjectCode", () => {
  it("slugifies ascii project names", () => {
    expect(slugifyProjectCode("Payments Platform")).toBe("payments-platform");
  });

  it("generates stable code for pure chinese names", () => {
    const code = slugifyProjectCode("支付平台");
    expect(code).toMatch(/^project-[a-z0-9]+$/);
    expect(slugifyProjectCode("支付平台")).toBe(code);
  });

  it("trims whitespace before slugifying", () => {
    expect(slugifyProjectCode("  Demo  ")).toBe("demo");
  });
});
