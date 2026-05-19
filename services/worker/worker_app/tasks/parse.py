import json
from pathlib import Path
from collections.abc import Mapping
from typing import Any

from worker_app.celery_app import celery_app

_HTTP_METHODS = {
    "delete",
    "get",
    "head",
    "options",
    "patch",
    "post",
    "put",
    "trace",
}


def _extract_operations(payload: dict[str, Any]) -> list[dict[str, str]]:
    operations: list[dict[str, str]] = []
    paths = payload.get("paths", {})
    if not isinstance(paths, Mapping):
        return operations

    for path, methods in paths.items():
        if not isinstance(methods, Mapping):
            continue

        for method, definition in methods.items():
            normalized_method = str(method).lower()
            if normalized_method not in _HTTP_METHODS:
                continue

            operation = definition if isinstance(definition, Mapping) else {}
            summary = _coerce_text(operation.get("summary"))
            if not summary:
                summary = _coerce_text(operation.get("operationId"))

            operations.append(
                {
                    "path": str(path),
                    "method": normalized_method,
                    "summary": summary,
                }
            )

    return operations


def _extract_prd_sections(text: str) -> list[dict[str, str]]:
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


def _extract_figma_nodes(payload: dict[str, Any]) -> list[dict[str, str]]:
    document = payload.get("document", {})
    if not isinstance(document, Mapping):
        return []

    nodes: list[dict[str, str]] = []
    _collect_nodes(document, nodes)
    return nodes


def _collect_nodes(node: Mapping[str, object], nodes: list[dict[str, str]]) -> None:
    node_name = str(node.get("name", "")).strip()
    node_type = str(node.get("type", "")).strip()
    node_id = str(node.get("id", "")).strip()

    if node_name or node_type or node_id:
        nodes.append({"id": node_id, "name": node_name, "type": node_type})

    children = node.get("children", [])
    if not isinstance(children, list):
        return

    for child in children:
        if isinstance(child, Mapping):
            _collect_nodes(child, nodes)


def _save_bytes(root: Path, relative_path: str, payload: bytes) -> str:
    candidate = Path(relative_path)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ValueError("relative_path must stay within the storage root")

    target = (root.resolve() / candidate).resolve()
    target.relative_to(root.resolve())
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)
    return str(target)


def _coerce_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _parse_payload(document_type: str, payload: dict[str, Any] | str) -> dict[str, Any]:
    normalized_type = document_type.strip().lower()

    if normalized_type == "swagger":
        if not isinstance(payload, dict):
            raise TypeError("Swagger payload must be a dictionary")
        return {"operations": _extract_operations(payload)}

    if normalized_type == "prd":
        if not isinstance(payload, str):
            raise TypeError("PRD payload must be text")
        return {"sections": _extract_prd_sections(payload)}

    if normalized_type == "figma":
        if not isinstance(payload, dict):
            raise TypeError("Figma payload must be a dictionary")
        return {"nodes": _extract_figma_nodes(payload)}

    raise ValueError(f"Unsupported document type: {document_type}")


@celery_app.task(name="documents.parse_version")
def parse_document_version(
    document_version_id: int,
    document_type: str | None = None,
    payload: dict[str, Any] | str | None = None,
    artifact_relative_path: str | None = None,
    artifact_root: str | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "document_version_id": document_version_id,
        "status": "pending_fetch",
        "document_type": document_type,
        "artifact_path": None,
        "parsed": None,
    }

    if document_type is None or payload is None:
        result["message"] = (
            "Document metadata lookup is not wired yet. "
            "Provide document_type and payload to execute parsing."
        )
        return result

    parsed = _parse_payload(document_type, payload)
    artifact_path: str | None = None

    if artifact_root and artifact_relative_path:
        artifact_path = _save_bytes(
            Path(artifact_root),
            artifact_relative_path,
            json.dumps(parsed, ensure_ascii=False, indent=2).encode("utf-8"),
        )

    result.update(
        {
            "status": "parsed",
            "artifact_path": artifact_path,
            "parsed": parsed,
        }
    )
    return result
