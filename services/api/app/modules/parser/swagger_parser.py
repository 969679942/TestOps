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


def _coerce_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
