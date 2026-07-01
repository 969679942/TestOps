export function matchesSearchQuery(
  values: Array<string | null | undefined>,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return tokens.every((token) => haystack.includes(token));
}
