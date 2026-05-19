import json
import sys
from pathlib import Path
from typing import Any

from worker_app.celery_app import celery_app

_API_SERVICE_ROOT = Path(__file__).resolve().parents[3] / "api"
if str(_API_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_SERVICE_ROOT))

from app.modules.document.storage import LocalArtifactStorage
from app.modules.parser.figma_parser import extract_figma_nodes
from app.modules.parser.prd_parser import extract_prd_sections
from app.modules.parser.swagger_parser import extract_operations


def _parse_payload(document_type: str, payload: dict[str, Any] | str) -> dict[str, Any]:
    normalized_type = document_type.strip().lower()

    if normalized_type == "swagger":
        if not isinstance(payload, dict):
            raise TypeError("Swagger payload must be a dictionary")
        return {"operations": extract_operations(payload)}

    if normalized_type == "prd":
        if not isinstance(payload, str):
            raise TypeError("PRD payload must be text")
        return {"sections": extract_prd_sections(payload)}

    if normalized_type == "figma":
        if not isinstance(payload, dict):
            raise TypeError("Figma payload must be a dictionary")
        return {"nodes": extract_figma_nodes(payload)}

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
        storage = LocalArtifactStorage(Path(artifact_root))
        artifact_path = storage.save_bytes(
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
