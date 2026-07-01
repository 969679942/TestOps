import json
from importlib import import_module
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.document import DocumentAsset, DocumentVersion
from app.models.project import Project
from worker_app.tasks import parse as parse_module


def test_parse_task_extracts_prd_business_rule_and_supplement_shapes() -> None:
    prd = parse_module._parse_payload(
        "prd",
        "# Checkout\n\n## Acceptance Criteria\n- Order is created",
    )
    rule = parse_module._parse_payload(
        "business_rule",
        "IF user is blocked THEN submit is denied",
    )
    supplement = parse_module._parse_payload(
        "supplement",
        "Clarification: guest checkout is disabled",
    )

    assert "sections" in prd
    assert "acceptance_criteria" in prd
    assert "rules" in rule
    assert "clarifications" in supplement


def test_parse_task_loads_document_version_from_db_and_updates_metadata(tmp_path, monkeypatch) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-parse.sqlite'}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)

    artifact_path = tmp_path / "uploads" / "swagger.json"
    artifact_path.parent.mkdir(parents=True)
    artifact_path.write_text(
        json.dumps(
            {
                "paths": {
                    "/orders": {
                        "post": {"summary": "Create order"},
                    }
                }
            }
        ),
        encoding="utf-8",
    )

    with testing_session_local() as session:
        project = Project(name="Parse Worker", code="parse-worker")
        session.add(project)
        session.commit()
        session.refresh(project)

        document = DocumentAsset(
            project_id=project.id,
            type="swagger",
            name="Checkout API",
            source_mode="upload",
        )
        session.add(document)
        session.commit()
        session.refresh(document)

        version = DocumentVersion(
            document_asset_id=document.id,
            version_no=1,
            storage_path=str(artifact_path),
            parse_status="queued",
            structured_metadata={},
        )
        session.add(version)
        session.commit()
        session.refresh(version)
        version_id = version.id

    monkeypatch.setattr(parse_module, "SessionLocal", testing_session_local)

    result = parse_module.parse_document_version(version_id)

    with testing_session_local() as session:
        persisted = session.get(DocumentVersion, version_id)
        persisted_document = session.get(DocumentAsset, persisted.document_asset_id)

    assert result["status"] == "parsed"
    assert result["document_type"] == "swagger"
    assert result["parsed"] == {
        "operations": [
            {"path": "/orders", "method": "post", "summary": "Create order"},
        ]
    }
    assert persisted is not None
    assert persisted.parse_status == "parsed"
    assert persisted.parse_summary == "接口文档解析完成：1 个接口操作"
    assert persisted.structured_metadata == result["parsed"]
    assert persisted_document is not None
    assert persisted_document.parse_status == "parsed"


def test_parse_task_uses_real_api_modules_and_persists_artifact(tmp_path) -> None:
    result = parse_module.parse_document_version(
        7,
        document_type="swagger",
        payload={
            "paths": {
                "/orders": {
                    "post": {"summary": "Create order"},
                }
            }
        },
        artifact_root=str(tmp_path),
        artifact_relative_path="artifacts/swagger.json",
    )

    assert result["status"] == "parsed"
    assert result["artifact_path"] == str(tmp_path / "artifacts" / "swagger.json")
    assert result["parsed"] == {
        "operations": [
            {"path": "/orders", "method": "post", "summary": "Create order"},
        ]
    }
    assert json.loads((tmp_path / "artifacts" / "swagger.json").read_text()) == result["parsed"]


def test_parse_task_imports_installed_api_modules() -> None:
    swagger_module = import_module(parse_module.extract_operations.__module__)
    storage_module = import_module(parse_module.LocalArtifactStorage.__module__)

    swagger_origin = Path(swagger_module.__file__).resolve()
    storage_origin = Path(storage_module.__file__).resolve()

    assert parse_module.extract_operations.__module__ == "app.modules.parser.swagger_parser"
    assert parse_module.LocalArtifactStorage.__module__ == "app.modules.document.storage"
    swagger_parts = {part.lower() for part in swagger_origin.parts}
    storage_parts = {part.lower() for part in storage_origin.parts}
    assert "site-packages" in swagger_parts or swagger_origin.match(
        "*/services/api/app/modules/parser/swagger_parser.py"
    )
    assert "site-packages" in storage_parts or storage_origin.match(
        "*/services/api/app/modules/document/storage.py"
    )


def test_parse_task_loads_swagger_from_source_uri_and_updates_metadata(
    tmp_path,
    monkeypatch,
) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-parse-source.sqlite'}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)

    with testing_session_local() as session:
        project = Project(name="Parse Worker Source", code="parse-worker-source")
        session.add(project)
        session.commit()
        session.refresh(project)

        document = DocumentAsset(
            project_id=project.id,
            type="swagger",
            name="Checkout API",
            source_mode="url",
            source_uri="https://example.test/openapi.json",
        )
        session.add(document)
        session.commit()
        session.refresh(document)

        version = DocumentVersion(
            document_asset_id=document.id,
            version_no=1,
            source_uri="https://example.test/openapi.json",
            parse_status="queued",
            structured_metadata={},
        )
        session.add(version)
        session.commit()
        session.refresh(version)
        version_id = version.id

    monkeypatch.setattr(parse_module, "SessionLocal", testing_session_local)
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return json.dumps(
                {
                    "paths": {
                        "/orders": {
                            "post": {"summary": "Create order"},
                        }
                    }
                }
            ).encode("utf-8")

    monkeypatch.setattr(parse_module, "urlopen", lambda source_uri, timeout=10: FakeResponse())

    result = parse_module.parse_document_version(version_id)

    with testing_session_local() as session:
        persisted = session.get(DocumentVersion, version_id)
        persisted_document = session.get(DocumentAsset, persisted.document_asset_id)

    assert result["status"] == "parsed"
    assert result["document_type"] == "swagger"
    assert result["parsed"] == {
        "operations": [
            {"path": "/orders", "method": "post", "summary": "Create order"},
        ]
    }
    assert persisted is not None
    assert persisted.parse_status == "parsed"
    assert persisted_document is not None
    assert persisted_document.parse_status == "parsed"
