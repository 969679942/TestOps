from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from app.modules.provider.base import ProviderGenerationRequest
from app.modules.provider.cursor_provider import CursorProvider, CursorProviderError


def test_cursor_provider_invokes_cursor_agent_and_parses_cases(monkeypatch, tmp_path):
    calls: list[dict[str, object]] = []

    def fake_which(command: str) -> str:
        assert command == "cursor-agent"
        return command

    def fake_run(args, **kwargs):
        calls.append({"args": args, "kwargs": kwargs})
        return subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=json.dumps(
                {
                    "type": "result",
                    "subtype": "success",
                    "is_error": False,
                    "result": json.dumps(
                        {
                            "cases": [
                                {
                                    "title": "Create order with saved card",
                                    "steps": ["Open checkout"],
                                    "expected_results": ["Order is created"],
                                }
                            ]
                        }
                    ),
                }
            ),
            stderr="",
        )

    monkeypatch.setattr("app.modules.provider.cursor_provider.shutil.which", fake_which)
    monkeypatch.setattr("app.modules.provider.cursor_provider.subprocess.run", fake_run)
    monkeypatch.setattr("app.modules.provider.cursor_provider.settings.cursor_agent_cwd", str(tmp_path))
    monkeypatch.setattr("app.modules.provider.cursor_provider.settings.cursor_agent_timeout_seconds", 7)

    provider = CursorProvider(model="cursor-default", prompt_version="smoke")
    response = provider.generate_test_cases(
        ProviderGenerationRequest(
            project_id=42,
            prompt_version="smoke",
            input_refs={"document_version_ids": [11, 12], "skill_version_id": 7},
            context_bundle={
                "document_versions": [11, 12],
                "ambiguities": [{"text": "Clarify refund timeout"}],
                "skill_package": {
                    "id": 7,
                    "summary": "Checkout v1",
                    "scenario_taxonomy": ["happy_path", "boundary"],
                    "coverage_dimensions": ["core_user_journey"],
                },
            },
        )
    )

    assert response.provider == "cursor"
    assert response.model == "cursor-default"
    assert response.payload["cases"][0]["title"] == "Create order with saved card"
    assert calls[0]["args"][:4] == [
        "cursor-agent",
        "--print",
        "--output-format",
        "json",
    ]
    assert "Project ID: 42" in calls[0]["args"][-1]
    assert '"scenario_taxonomy": ["happy_path", "boundary"]' in calls[0]["args"][-1]
    assert '"coverage_dimensions": ["core_user_journey"]' in calls[0]["args"][-1]
    assert 'Known ambiguities: [{"text": "Clarify refund timeout"}]' in calls[0]["args"][-1]
    assert calls[0]["kwargs"]["cwd"] == str(tmp_path)
    assert calls[0]["kwargs"]["timeout"] == 7


def test_cursor_provider_extracts_json_from_markdown_result(monkeypatch):
    def fake_run(args, **kwargs):
        return subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=json.dumps(
                {
                    "type": "result",
                    "is_error": False,
                    "result": '```json\n{"cases":[{"title":"A","steps":["S"],"expected_results":["E"]}]}\n```',
                }
            ),
            stderr="",
        )

    monkeypatch.setattr("app.modules.provider.cursor_provider.shutil.which", lambda command: command)
    monkeypatch.setattr("app.modules.provider.cursor_provider.subprocess.run", fake_run)

    response = CursorProvider().generate_test_cases(
        ProviderGenerationRequest(project_id=1, prompt_version="default")
    )

    assert response.payload == {
        "cases": [{"title": "A", "steps": ["S"], "expected_results": ["E"]}]
    }


def test_cursor_provider_reports_missing_cli(monkeypatch):
    monkeypatch.setattr("app.modules.provider.cursor_provider.shutil.which", lambda command: None)

    with pytest.raises(CursorProviderError, match="cursor-agent command was not found"):
        CursorProvider().generate_test_cases(
            ProviderGenerationRequest(project_id=1, prompt_version="default")
        )


def test_cursor_provider_reports_failed_cli(monkeypatch):
    def fake_run(args, **kwargs):
        return subprocess.CompletedProcess(
            args=args,
            returncode=2,
            stdout="",
            stderr="not logged in",
        )

    monkeypatch.setattr("app.modules.provider.cursor_provider.shutil.which", lambda command: command)
    monkeypatch.setattr("app.modules.provider.cursor_provider.subprocess.run", fake_run)

    with pytest.raises(CursorProviderError, match="not logged in"):
        CursorProvider().generate_test_cases(
            ProviderGenerationRequest(project_id=1, prompt_version="default")
        )


def test_cursor_provider_reports_timeout(monkeypatch):
    def fake_run(args, **kwargs):
        raise subprocess.TimeoutExpired(cmd=args, timeout=3)

    monkeypatch.setattr("app.modules.provider.cursor_provider.shutil.which", lambda command: command)
    monkeypatch.setattr("app.modules.provider.cursor_provider.subprocess.run", fake_run)
    monkeypatch.setattr("app.modules.provider.cursor_provider.settings.cursor_agent_timeout_seconds", 3)

    with pytest.raises(CursorProviderError, match="timed out after 3 seconds"):
        CursorProvider().generate_test_cases(
            ProviderGenerationRequest(project_id=1, prompt_version="default")
        )
