import json
from pathlib import Path
from typing import Any
from urllib.request import urlopen

from docx import Document as DocxDocument
from pypdf import PdfReader

from app.core.database import SessionLocal
from app.models.document import DocumentAsset, DocumentVersion
from app.modules.document.storage import LocalArtifactStorage
from app.modules.parser.figma_parser import extract_figma_nodes
from app.modules.parser.prd_parser import extract_prd_sections
from app.modules.parser.swagger_parser import extract_operations
from worker_app.celery_app import celery_app


def _build_parse_summary(document_type: str, parsed: dict[str, Any]) -> str:
    normalized_type = document_type.strip().lower()

    if normalized_type == "prd":
        quality = parsed.get("quality_summary", {})
        if isinstance(quality, dict):
            return (
                "PRD 解析完成："
                f"{quality.get('requirement_count', 0)} 条需求，"
                f"{quality.get('acceptance_criteria_count', 0)} 条验收标准，"
                f"{quality.get('edge_case_count', 0)} 个边界/异常场景，"
                f"{quality.get('open_question_count', 0)} 个待澄清点"
            )

    if normalized_type == "business_rule":
        return (
            "业务规则解析完成："
            f"{len(parsed.get('rules', []))} 条规则，"
            f"{len(parsed.get('constraints', []))} 条约束，"
            f"{len(parsed.get('outcomes', []))} 条结果"
        )

    if normalized_type == "supplement":
        return (
            "补充资料解析完成："
            f"{len(parsed.get('clarifications', []))} 条补充说明，"
            f"{len(parsed.get('glossary', []))} 条术语，"
            f"{len(parsed.get('open_questions', []))} 个待确认问题"
        )

    if normalized_type == "swagger":
        return f"接口文档解析完成：{len(parsed.get('operations', []))} 个接口操作"

    if normalized_type == "figma":
        return f"设计稿解析完成：{len(parsed.get('nodes', []))} 个节点"

    return "解析完成"


def _parse_payload(document_type: str, payload: dict[str, Any] | str) -> dict[str, Any]:
    normalized_type = document_type.strip().lower()

    if normalized_type == "swagger":
        if not isinstance(payload, dict):
            raise TypeError("Swagger payload must be a dictionary")
        return {"operations": extract_operations(payload)}

    if normalized_type == "prd":
        if not isinstance(payload, str):
            raise TypeError("PRD payload must be text")
        return extract_prd_sections(payload)

    if normalized_type == "business_rule":
        if not isinstance(payload, str):
            raise TypeError("Business rule payload must be text")
        rules = []
        conditions = []
        outcomes = []
        constraints = []
        exceptions = []
        for raw_line in payload.splitlines():
            stripped = raw_line.strip()
            if not stripped:
                continue
            rules.append({"text": stripped, "source_kind": "rule"})
            upper = stripped.upper()
            if upper.startswith("IF "):
                conditions.append({"text": stripped})
            if " THEN " in upper:
                parts = stripped.split("THEN", 1)
                if len(parts) == 2:
                    outcomes.append({"text": parts[1].strip()})
            if any(keyword in upper for keyword in ["MUST", "ONLY", "CANNOT", "NOT ALLOW"]):
                constraints.append({"text": stripped})
            if any(keyword in upper for keyword in ["EXCEPT", "UNLESS", "INVALID", "ERROR", "FAIL"]):
                exceptions.append({"text": stripped})
        return {
            "rules": rules,
            "conditions": conditions,
            "outcomes": outcomes,
            "constraints": constraints,
            "exceptions": exceptions,
        }

    if normalized_type == "supplement":
        if not isinstance(payload, str):
            raise TypeError("Supplement payload must be text")
        clarifications = []
        glossary = []
        open_questions = []
        for raw_line in payload.splitlines():
            stripped = raw_line.strip()
            if not stripped:
                continue
            if "?" in stripped:
                open_questions.append({"text": stripped})
            elif ":" in stripped:
                key, value = stripped.split(":", 1)
                glossary.append({"term": key.strip(), "definition": value.strip()})
                clarifications.append({"text": stripped})
            else:
                clarifications.append({"text": stripped})
        return {
            "clarifications": clarifications,
            "glossary": glossary,
            "open_questions": open_questions,
        }

    if normalized_type == "figma":
        if not isinstance(payload, dict):
            raise TypeError("Figma payload must be a dictionary")
        return {"nodes": extract_figma_nodes(payload)}

    raise ValueError(f"Unsupported document type: {document_type}")


def _load_artifact_payload(document_type: str, storage_path: str) -> dict[str, Any] | str:
    path = Path(storage_path)
    normalized_type = document_type.strip().lower()
    if normalized_type in {"prd", "business_rule", "supplement"}:
        return _read_text_payload(path)
    return json.loads(path.read_text(encoding="utf-8"))


def _read_remote_text(source_uri: str) -> str:
    with urlopen(source_uri, timeout=10) as response:  # noqa: S310
        payload = response.read()
    return payload.decode("utf-8", errors="replace")


def _load_remote_payload(document_type: str, source_uri: str) -> dict[str, Any] | str:
    normalized_type = document_type.strip().lower()

    if normalized_type == "figma":
        return {
            "document": {
                "name": "Figma reference",
                "type": "FIGMA_FILE",
                "source_uri": source_uri,
            }
        }

    raw_text = _read_remote_text(source_uri)
    if normalized_type == "swagger":
        return json.loads(raw_text)
    return raw_text


def _read_text_payload(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        document = DocxDocument(path)
        return "\n".join(
            paragraph.text.strip()
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        )
    if suffix == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join((page.extract_text() or "").strip() for page in reader.pages).strip()
    return path.read_text(encoding="utf-8")


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
            if version.storage_path:
                payload = _load_artifact_payload(document.type, version.storage_path)
            elif version.source_uri:
                payload = _load_remote_payload(document.type, version.source_uri)
            else:
                raise ValueError("Document version has no stored artifact or source URI to parse.")
            parsed = _parse_payload(document.type, payload)
            version.parse_status = "parsed"
            document.parse_status = "parsed"
            version.parse_summary = _build_parse_summary(document.type, parsed)
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
