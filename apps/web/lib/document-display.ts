import { copy } from "./copy";

/** Hide internal storage URIs from product-facing UI. */
export function formatDocumentSourceDisplay(sourceUri: string | null | undefined): string {
  const trimmed = sourceUri?.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith("storage://")) {
    return copy.internalStorage;
  }
  return trimmed;
}

export function shouldShowDocumentSourceLine(sourceUri: string | null | undefined): boolean {
  const trimmed = sourceUri?.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith("storage://")) {
    return false;
  }
  return true;
}
