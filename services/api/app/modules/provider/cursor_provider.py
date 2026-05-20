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


def _build_prompt(request: ProviderGenerationRequest) -> str:
    return "\n".join(
        [
            "You are generating QA test case drafts for the TestOps platform.",
            "Return only JSON with this shape:",
            '{"cases":[{"title":"...","steps":["..."],"expected_results":["..."]}]}',
            f"Project ID: {request.project_id}",
            f"Prompt profile: {request.prompt_version}",
            f"Input refs: {json.dumps(dict(request.input_refs), ensure_ascii=False)}",
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
