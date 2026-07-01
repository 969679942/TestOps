from __future__ import annotations

import json
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.modules.provider.base import ProviderGenerationRequest, ProviderGenerationResponse


class CursorProviderError(RuntimeError):
    pass


def _render_json_section(title: str, value: Any) -> str:
    return f"{title}: {json.dumps(value, ensure_ascii=False)}"


def _build_prompt(request: ProviderGenerationRequest) -> str:
    context_bundle = dict(request.context_bundle)
    skill_package = context_bundle.get("skill_package", {})
    input_refs = dict(request.input_refs)
    seed_test_case_ids = input_refs.get("seed_test_case_ids", [])
    coverage_gap_note = input_refs.get("coverage_gap_note")

    return "\n".join(
        [
            "You are a senior QA analyst generating traceable test case drafts for the TestOps platform.",
            "Return only JSON with this shape:",
            '{"cases":[{"title":"...","module":"...","feature":"...","case_type":"functional|negative|regression|permission|boundary","priority":"high|medium|low","linked_requirement":"...","preconditions":[{"text":"..."}],"steps":[{"text":"..."}],"expected_results":[{"text":"..."}],"tags":["..."],"source_refs":[{"source_kind":"document_version","document_version_id":1,"document_name":"...","section":"...","excerpt":"..."}]}]}',
            "Generation rules:",
            "1. Every case must be backed by explicit evidence from requirements, business rules, contracts, UI hints, supplements, or the gap note.",
            "2. Do not invent unsupported fields, APIs, roles, states, or business rules.",
            "3. Prefer concise, executable steps and observable expected results.",
            "4. Cover the core user journey first, then boundary, negative, permission, state, recovery, or regression scenarios when evidence supports them.",
            "5. If sources contain ambiguity, stay conservative and anchor the case to the clearest available evidence.",
            f"Project ID: {request.project_id}",
            f"Prompt profile: {request.prompt_version}",
            _render_json_section("Selected document versions", input_refs.get("document_version_ids", [])),
            _render_json_section("Selected skill version", input_refs.get("skill_version_id")),
            _render_json_section("Selected skill binding", input_refs.get("skill_binding_id")),
            _render_json_section("Selected global skill version", input_refs.get("global_skill_version_id")),
            _render_json_section("Seed test case ids", seed_test_case_ids),
            _render_json_section("Coverage gap note", coverage_gap_note),
            _render_json_section("Document catalog", context_bundle.get("document_catalog", [])),
            _render_json_section(
                "Requirements and acceptance criteria",
                {
                    "requirement_candidates": context_bundle.get("requirement_candidates", [])[:16],
                    "acceptance_criteria": context_bundle.get("acceptance_criteria", [])[:16],
                },
            ),
            _render_json_section(
                "Business rules and supplemental clarifications",
                {
                    "business_rules": context_bundle.get("business_rules", [])[:16],
                    "supplements": context_bundle.get("supplements", [])[:16],
                    "edge_cases": context_bundle.get("edge_cases", [])[:16],
                },
            ),
            _render_json_section(
                "API and UI hints",
                {
                    "swagger_hints": context_bundle.get("swagger_hints", [])[:16],
                    "figma_hints": context_bundle.get("figma_hints", [])[:16],
                },
            ),
            _render_json_section("Known ambiguities", context_bundle.get("ambiguities", [])[:12]),
            _render_json_section(
                "Skill generation profile",
                {
                    "name": skill_package.get("name"),
                    "summary": skill_package.get("summary"),
                    "template_key": skill_package.get("metadata", {}).get("template_key")
                    if isinstance(skill_package.get("metadata"), dict)
                    else None,
                    "prompt_template": skill_package.get("prompt_template"),
                    "scenario_taxonomy": skill_package.get("scenario_taxonomy", []),
                    "review_checklist": skill_package.get("review_checklist", []),
                    "coverage_dimensions": skill_package.get("coverage_dimensions", []),
                    "evidence_policy": skill_package.get("evidence_policy"),
                },
            ),
            "Populate linked_requirement with the clearest requirement sentence, rule identifier, or gap note.",
            "Populate source_refs with the concrete document_version / skill_version / rule references used to derive the case.",
        ]
    )


def _extract_json_object(value: str) -> dict[str, Any]:
    stripped = value.strip()
    fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, re.DOTALL)
    if fenced_match:
        stripped = fenced_match.group(1)
    elif not stripped.startswith("{"):
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise CursorProviderError("Cursor response did not contain a JSON object.")
        stripped = stripped[start : end + 1]

    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError as exc:
        raise CursorProviderError(f"Cursor response was not valid JSON: {exc}") from exc

    if not isinstance(parsed, dict):
        raise CursorProviderError("Cursor response JSON must be an object.")
    return parsed


def _resolve_command(command: str) -> str:
    command_path = Path(command)
    if command_path.is_file():
        return str(command_path)

    resolved = shutil.which(command)
    if resolved is None:
        raise CursorProviderError(
            f"{command} command was not found. Install Cursor Agent CLI or set "
            "CURSOR_AGENT_COMMAND to its full path."
        )
    return resolved


@dataclass(slots=True)
class CursorProvider:
    default_model = "cursor-default"

    model: str = default_model
    prompt_version: str = "default"
    name: str = "cursor"

    def generate_test_cases(
        self,
        request: ProviderGenerationRequest,
    ) -> ProviderGenerationResponse:
        command = _resolve_command(settings.cursor_agent_command)
        args = [
            command,
            "--print",
            "--output-format",
            "json",
            _build_prompt(request),
        ]
        try:
            completed = subprocess.run(
                args,
                capture_output=True,
                text=True,
                timeout=settings.cursor_agent_timeout_seconds,
                cwd=settings.cursor_agent_cwd,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise CursorProviderError(
                "Cursor provider invocation timed out after "
                f"{settings.cursor_agent_timeout_seconds} seconds."
            ) from exc

        if completed.returncode != 0:
            details = completed.stderr.strip() or completed.stdout.strip()
            raise CursorProviderError(
                f"Cursor provider invocation failed with exit code "
                f"{completed.returncode}: {details}"
            )

        envelope = _extract_json_object(completed.stdout)
        if envelope.get("is_error") is True:
            raise CursorProviderError(str(envelope.get("result") or "Cursor returned an error."))

        result = envelope.get("result", envelope)
        payload = _extract_json_object(result) if isinstance(result, str) else result
        if not isinstance(payload, dict):
            raise CursorProviderError("Cursor provider result payload must be a JSON object.")

        return ProviderGenerationResponse(
            payload=payload,
            provider=self.name,
            model=self.model,
            metadata={
                "prompt_version": request.prompt_version,
                "cursor_agent_command": settings.cursor_agent_command,
                "cursor_output_type": envelope.get("type"),
                "cursor_output_subtype": envelope.get("subtype"),
            },
        )
