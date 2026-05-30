import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DocumentTable } from "../../components/document-table";
import type { DocumentAsset } from "../../lib/types";

describe("DocumentTable", () => {
  it("renders document asset rows", () => {
    const items: DocumentAsset[] = [
      {
        id: 1,
        projectId: 1,
        name: "Checkout PRD",
        type: "prd",
        sourceMode: "upload",
        sourceUri: "docs/checkout-prd.pdf",
        parseStatus: "parsed",
      },
    ];

    const html = renderToStaticMarkup(<DocumentTable items={items} />);

    expect(html).toContain("Checkout PRD");
    expect(html).toContain("Parsed");
    expect(html).toContain("<table");
  });
});
