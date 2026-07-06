"use client";

import { useId, useState } from "react";

import { fieldHelp, type FieldHelpKey } from "../lib/design-spec-copy";

type FieldHelpProps = Readonly<{
  field: FieldHelpKey;
  label?: string;
}>;

export function FieldHelp({ field, label = "字段说明" }: FieldHelpProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="field-help">
      <button
        aria-describedby={open ? tooltipId : undefined}
        aria-label={label}
        className="field-help-trigger"
        type="button"
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        ?
      </button>
      {open ? (
        <span className="field-help-tooltip" id={tooltipId} role="tooltip">
          {fieldHelp[field]}
        </span>
      ) : null}
    </span>
  );
}
