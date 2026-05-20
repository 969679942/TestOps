import json
from pathlib import Path
from typing import Any

from app.core.database import SessionLocal
from app.models.document import DocumentAsset, DocumentVersion
from app.modules.document.storage import LocalArtifactStorage
from app.modules.parser.figma_parser import extract_figma_nodes
from app.modules.parser.prd_parser import extract_prd_sections
from app.modules.parser.swagger_parser import extract_operations
from worker_app.celery_app import celery_app


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


def _load_artifact_payload(document_type: str, storage_path: str) -> dict[str, Any] | str:
    path = Path(storage_path)
    normalized_type = document_type.strip().lower()
    if normalized_type == "prd":
        return path.read_text(encoding="utf-8")
    return json.loads(path.read_text(encoding="utf-8"))


def _parse_stored_document_version(document_version_id: int) -> dict[str, Any]:
    with SessionLocal() as session:
        version = session.get(DocumentVersion, document_version_id)
        if version is None:
            raise ValueError(f"Document version not found: {document_version_id}")

        document = session.get(DocumentAsset, version.document_asset_id)
        if document is None:
            raise ValueError(f"Document asset not found: {version.document_asset_id}")

        version.parse_status = "processing"
        document.parse_status = "processing"
        version.parse_summary = None
        session.add(document)
        session.add(version)
        session.commit()

        try:
            if not version.storage_path:
                raise ValueError("Document version has no stored artifact to parse.")

            payload = _load_artifact_payload(document.type, version.storage_path)
            parsed = _parse_payload(document.type, payload)
            version.parse_status = "parsed"
            document.parse_status = "parsed"
            version.parse_summary = None
            version.structured_metadata = parsed
            session.add(document)
            session.add(version)
            session.commit()
        except Exception as exc:
            version.parse_status = "failed"
            document.parse_status = "failed"
            version.parse_summary = str(exc)
            session.add(document)
            session.add(version)
            session.commit()
            raise

        return {
            "document_version_id": document_version_id,
            "status": "parsed",
            "document_type": document.type,
            "artifact_path": version.storage_path,
            "parsed": parsed,
        }


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
        return _parse_stored_document_version(document_version_id)

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
