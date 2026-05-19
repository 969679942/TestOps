def extract_prd_sections(text: str) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []
    heading: str | None = None
    body_lines: list[str] = []

    def flush_section() -> None:
        nonlocal heading, body_lines

        if heading is None:
            return

        body = "\n".join(body_lines).strip()
        sections.append({"heading": heading, "body": body})
        body_lines = []

    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("#"):
            flush_section()
            heading = stripped.lstrip("#").strip() or "Untitled Section"
            continue

        if heading is None:
            if stripped:
                heading = "Document"
                body_lines.append(stripped)
            continue

        body_lines.append(raw_line.rstrip())

    flush_section()
    return sections
