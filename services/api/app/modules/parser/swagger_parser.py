from collections.abc import Mapping
from typing import Any

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


def extract_operations(payload: dict) -> list[dict[str, str]]:
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


def extract_setup_candidates(payload: dict) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    paths = payload.get("paths", {})
    if not isinstance(paths, Mapping):
        return candidates

    for path, methods in paths.items():
        if not isinstance(methods, Mapping):
            continue

        for method, definition in methods.items():
            normalized_method = str(method).lower()
            if normalized_method not in {"post", "put", "patch"}:
                continue

            operation = definition if isinstance(definition, Mapping) else {}
            request_schema = _extract_json_request_schema(operation)
            if not request_schema:
                continue

            summary = _coerce_text(operation.get("summary"))
            if not summary:
                summary = _coerce_text(operation.get("operationId"))

            candidates.append(
                {
                    "path": str(path),
                    "method": normalized_method,
                    "summary": summary,
                    "request_schema": request_schema,
                    "required_parameters": _extract_required_parameters(request_schema),
                }
            )

    return candidates


def _extract_json_request_schema(operation: Mapping[str, Any]) -> dict[str, Any]:
    request_body = operation.get("requestBody")
    if not isinstance(request_body, Mapping):
        return {}

    content = request_body.get("content")
    if not isinstance(content, Mapping):
        return {}

    json_content = content.get("application/json")
    if not isinstance(json_content, Mapping):
        return {}

    schema = json_content.get("schema")
    if not isinstance(schema, Mapping):
        return {}

    return dict(schema)


def _extract_required_parameters(schema: Mapping[str, Any]) -> list[str]:
    required = schema.get("required", [])
    if not isinstance(required, list):
        return []
    return [str(item) for item in required]


def _coerce_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
