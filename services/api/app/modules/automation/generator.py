from __future__ import annotations

import re
from dataclasses import dataclass

from app.models.testcase import TestCase


@dataclass(frozen=True)
class GeneratedAutomationFiles:
    spec_relative_path: str
    page_object_relative_path: str
    spec_content: str
    page_object_content: str


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "test-case"


def _comment_lines(title: str, values: list[str]) -> list[str]:
    if not values:
        return [f"  // {title}: none"]
    lines = [f"  // {title}:"]
    lines.extend(f"  // - {value}" for value in values)
    return lines


def _text_items(values: list[dict[str, str]]) -> list[str]:
    return [str(item.get("text", "")).strip() for item in values if item.get("text")]


def generate_playwright_pom_files(test_case: TestCase) -> GeneratedAutomationFiles:
    slug = slugify(test_case.title)
    class_name = "CheckoutPage"
    spec_relative_path = f"tests/{slug}.spec.ts"
    page_object_relative_path = f"pages/{slug}.page.ts"

    preconditions = list(test_case.preconditions)
    steps = _text_items(test_case.steps)
    expected_results = _text_items(test_case.expected_results)
    notes = [test_case.automation_notes] if test_case.automation_notes else []

    spec_lines = [
        "import { test, expect } from '@playwright/test';",
        f"import {{ {class_name} }} from '../pages/{slug}.page';",
        "",
        f"test('{test_case.title}', async ({{ page }}) => {{",
        f"  const checkoutPage = new {class_name}(page);",
        *_comment_lines("Preconditions", preconditions),
        *_comment_lines("Steps", steps),
        *_comment_lines("Expected results", expected_results),
        *_comment_lines("Automation notes", notes),
        "  await checkoutPage.goto();",
        "  await checkoutPage.performScenario();",
        "  await expect(page).toHaveURL(/.*/);",
        "});",
        "",
    ]

    page_lines = [
        "import type { Page } from '@playwright/test';",
        "",
        f"export class {class_name} {{",
        "  constructor(private readonly page: Page) {}",
        "",
        "  async goto() {",
        "    await this.page.goto('/');",
        "  }",
        "",
        "  async performScenario() {",
        f"    // TODO: Implement generated flow for: {test_case.title}",
        "  }",
        "}",
        "",
    ]

    return GeneratedAutomationFiles(
        spec_relative_path=spec_relative_path,
        page_object_relative_path=page_object_relative_path,
        spec_content="\n".join(spec_lines),
        page_object_content="\n".join(page_lines),
    )
