import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConfirmActionModal } from "../../components/confirm-action-modal";

describe("ConfirmActionModal", () => {
  it("does not render modal markup during server rendering", () => {
    const html = renderToStaticMarkup(
      <ConfirmActionModal
        open
        title="归档项目"
        description="归档后项目将从默认列表隐藏。"
        confirmLabel="确认归档"
        cancelLabel="取消"
        tone="danger"
        onClose={() => {}}
        onConfirm={async () => {}}
      />,
    );

    expect(html).toBe("");
  });
});
