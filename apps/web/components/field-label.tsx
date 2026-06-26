import type { ReactNode } from "react";

type FieldLabelProps = Readonly<{
  children: ReactNode;
  required?: boolean;
}>;

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <span className={`field-label ${required ? "is-required" : ""}`}>
      <span>{children}</span>
      {required ? (
        <span className="field-label-required-mark" aria-hidden="true">
          *
        </span>
      ) : null}
    </span>
  );
}
