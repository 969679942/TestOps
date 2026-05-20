import json
from importlib import import_module
from pathlib import Path

from worker_app.tasks import parse as parse_module


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
