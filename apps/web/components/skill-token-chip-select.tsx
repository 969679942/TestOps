"use client";

import { useMemo, useState } from "react";

import type { SkillTokenOption } from "../lib/skill-copy";
import { FieldLabel } from "./field-label";

type SkillTokenChipSelectProps = Readonly<{
  name: string;
  label: string;
  options: SkillTokenOption[];
  defaultValues: string[];
  helperText?: string;
  required?: boolean;
  error?: string;
  onSelectionChange?: (values: string[]) => void;
}>;

export function SkillTokenChipSelect({
  name,
  label,
  options,
  defaultValues,
  helperText,
  required = false,
  error,
  onSelectionChange,
}: SkillTokenChipSelectProps) {
  const [selected, setSelected] = useState<string[]>(defaultValues);

  const value = useMemo(() => selected.join(", "), [selected]);

  function toggle(valueKey: string) {
    setSelected((current) => {
      const next = current.includes(valueKey)
        ? current.filter((item) => item !== valueKey)
        : [...current, valueKey];
      onSelectionChange?.(next);
      return next;
    });
  }

  return (
    <div className={`form-field skill-chip-select-field${error ? " has-error" : ""}`}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input type="hidden" name={name} value={value} />
      <div
        className={`skill-chip-select${error ? " is-invalid" : ""}`}
        role="group"
        aria-label={label}
        aria-invalid={error ? "true" : "false"}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={`skill-chip-select-option${isSelected ? " is-selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {helperText ? <p className="helper-text">{helperText}</p> : null}
    </div>
  );
}
