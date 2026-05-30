export function slugifyProjectCode(name: string): string {
  const trimmed = name.trim();
  const ascii = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  if (ascii) {
    return ascii;
  }

  const hash = [...trimmed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `project-${hash.toString(36).slice(0, 10)}`;
}
