import { describe, expect, it } from "vitest";

import {
  formatDocumentSourceDisplay,
  shouldShowDocumentSourceLine,
} from "../../lib/document-display";

describe("document-display", () => {
  it("hides internal storage URIs", () => {
    expect(formatDocumentSourceDisplay("storage://19/7e0a571a7462-1._.md")).toBe("内部存储");
    expect(shouldShowDocumentSourceLine("storage://19/7e0a571a7462-1._.md")).toBe(false);
  });

  it("shows external URLs and file paths", () => {
    expect(formatDocumentSourceDisplay("https://example.com/swagger.json")).toBe(
      "https://example.com/swagger.json",
    );
    expect(formatDocumentSourceDisplay("docs/payments-prd.pdf")).toBe("docs/payments-prd.pdf");
    expect(shouldShowDocumentSourceLine("https://example.com/swagger.json")).toBe(true);
  });

  it("falls back to internal storage label when empty", () => {
    expect(formatDocumentSourceDisplay(null)).toBe("内部存储");
    expect(formatDocumentSourceDisplay("")).toBe("内部存储");
  });
});
