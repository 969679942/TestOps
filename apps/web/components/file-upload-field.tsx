"use client";

import { useId, useRef } from "react";

import { copy } from "../lib/copy";

type FileUploadFieldProps = Readonly<{
  accept?: string;
  disabled?: boolean;
  fileName?: string | null;
  onFileChange: (file: File | null) => void;
}>;

export function FileUploadField({
  accept,
  disabled = false,
  fileName,
  onFileChange,
}: FileUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="file-upload-field">
      <input
        ref={inputRef}
        id={inputId}
        className="file-upload-input"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <button
        className="button-secondary"
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? copy.rechooseFile : copy.chooseFile}
      </button>
      <span className="file-upload-name">{fileName ?? copy.noFileChosen}</span>
    </div>
  );
}
