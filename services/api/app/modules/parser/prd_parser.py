from __future__ import annotations

import re

_REQUIREMENT_TOKENS = (
    "must",
    "should",
    "shall",
    "required",
    "需要",
    "必须",
    "应",
    "支持",
    "允许",
)
_RULE_TOKENS = ("if ", "then ", "must", "only", "cannot", "not allow", "禁止", "不可", "仅", "必须")
_EDGE_TOKENS = (
    "error",
    "invalid",
    "fail",
    "timeout",
    "duplicate",
    "empty",
    "expired",
    "异常",
    "失败",
    "错误",
    "边界",
    "重复",
    "为空",
    "超时",
    "过期",
)
_ACTOR_PATTERN = re.compile(
    r"\b(admin|administrator|user|customer|operator|merchant|reviewer|guest)\b|"
    r"(管理员|用户|客户|运营|商家|审核员|访客)"
)


def _normalize_bullet(line: str) -> str:
    return re.sub(r"^[-*+\d.()\s]+", "", line).strip()


def _collect_line_patterns(
    *,
    heading: str,
    body_lines: list[str],
    acceptance_criteria: list[dict[str, str]],
    field_definitions: list[dict[str, str]],
    user_actions: list[dict[str, str]],
    open_questions: list[dict[str, str]],
    requirement_items: list[dict[str, str]],
    business_rules: list[dict[str, str]],
    edge_cases: list[dict[str, str]],
    actors: list[dict[str, str]],
    entities: list[dict[str, str]],
) -> None:
    lowered_heading = heading.lower()

    for line in body_lines:
        stripped = line.strip()
        if not stripped:
            continue

        normalized = _normalize_bullet(stripped)
        lowered = normalized.lower()

        if "?" in stripped:
            open_questions.append({"section": heading, "text": normalized})

        if (
            "acceptance" in lowered_heading
            or "验收" in heading
            or "criteria" in lowered_heading
        ) and normalized:
            acceptance_criteria.append({"section": heading, "text": normalized})

        if ":" in stripped and any(token in lowered_heading for token in ["field", "data", "字段", "数据"]):
            name, value = stripped.split(":", 1)
            field_name = name.strip()
            definition = value.strip()
            field_definitions.append(
                {"section": heading, "field": field_name, "definition": definition}
            )
            entities.append({"section": heading, "name": field_name, "kind": "field"})

        if lowered.startswith(("click ", "open ", "submit ", "select ", "enter ", "填写", "点击", "打开", "提交", "选择")):
            user_actions.append({"section": heading, "text": normalized})

        if any(token in lowered for token in _REQUIREMENT_TOKENS):
            requirement_items.append({"section": heading, "text": normalized})

        if any(token in lowered for token in _RULE_TOKENS):
            business_rules.append({"section": heading, "text": normalized})

        if any(token in lowered for token in _EDGE_TOKENS):
            edge_cases.append({"section": heading, "text": normalized})

        actor_match = _ACTOR_PATTERN.search(normalized)
        if actor_match:
            actors.append({"section": heading, "name": actor_match.group(0), "text": normalized})


def extract_prd_sections(text: str) -> dict[str, list[dict[str, str]] | dict[str, int | bool]]:
    sections: list[dict[str, str]] = []
    acceptance_criteria: list[dict[str, str]] = []
    field_definitions: list[dict[str, str]] = []
    user_actions: list[dict[str, str]] = []
    open_questions: list[dict[str, str]] = []
    requirement_items: list[dict[str, str]] = []
    business_rules: list[dict[str, str]] = []
    edge_cases: list[dict[str, str]] = []
    actors: list[dict[str, str]] = []
    entities: list[dict[str, str]] = []
    heading: str | None = None
    body_lines: list[str] = []

    def flush_section() -> None:
        nonlocal heading, body_lines

        if heading is None:
            return

        body = "\n".join(body_lines).strip()
        sections.append({"heading": heading, "body": body})
        _collect_line_patterns(
            heading=heading,
            body_lines=body_lines,
            acceptance_criteria=acceptance_criteria,
            field_definitions=field_definitions,
            user_actions=user_actions,
            open_questions=open_questions,
            requirement_items=requirement_items,
            business_rules=business_rules,
            edge_cases=edge_cases,
            actors=actors,
            entities=entities,
        )
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

    quality_summary = {
        "section_count": len(sections),
        "acceptance_criteria_count": len(acceptance_criteria),
        "requirement_count": len(requirement_items),
        "business_rule_count": len(business_rules),
        "edge_case_count": len(edge_cases),
        "open_question_count": len(open_questions),
        "has_acceptance_criteria": bool(acceptance_criteria),
        "needs_clarification": bool(open_questions),
    }

    return {
        "sections": sections,
        "acceptance_criteria": acceptance_criteria,
        "field_definitions": field_definitions,
        "user_actions": user_actions,
        "open_questions": open_questions,
        "requirement_items": requirement_items,
        "business_rules": business_rules,
        "edge_cases": edge_cases,
        "actors": actors,
        "entities": entities,
        "quality_summary": quality_summary,
    }
