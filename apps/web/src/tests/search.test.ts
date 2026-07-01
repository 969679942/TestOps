import { describe, expect, it } from "vitest";

import { matchesSearchQuery } from "../../lib/search";

describe("matchesSearchQuery", () => {
  it("matches a single keyword against joined values", () => {
    expect(
      matchesSearchQuery(["Account Center", "account-center", "Identity flows"], "identity"),
    ).toBe(true);
  });

  it("matches multiple keywords in any order", () => {
    expect(
      matchesSearchQuery(
        ["生成用例", "Account Center", "account-center"],
        "Account Center 生成用例",
      ),
    ).toBe(true);
    expect(
      matchesSearchQuery(
        ["生成用例", "Account Center", "account-center"],
        "生成用例 Account",
      ),
    ).toBe(true);
  });

  it("returns false when any token is missing", () => {
    expect(
      matchesSearchQuery(["生成用例", "Account Center", "account-center"], "refund 生成用例"),
    ).toBe(false);
  });
});
