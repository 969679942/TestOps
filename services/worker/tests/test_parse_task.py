import importlib.util
import sys
import types
from pathlib import Path


def _load_parse_module():
    module_path = Path(__file__).resolve().parents[1] / "worker_app" / "tasks" / "parse.py"

    worker_app_package = types.ModuleType("worker_app")
    worker_app_package.__path__ = []  # type: ignore[attr-defined]

    celery_app_module = types.ModuleType("worker_app.celery_app")

    class FakeCeleryApp:
        def task(self, **_kwargs):
            def decorator(func):
                return func

            return decorator

    celery_app_module.celery_app = FakeCeleryApp()

    app_package = types.ModuleType("app")
    app_package.__path__ = []  # type: ignore[attr-defined]
    modules_package = types.ModuleType("app.modules")
    modules_package.__path__ = []  # type: ignore[attr-defined]
    document_package = types.ModuleType("app.modules.document")
    document_package.__path__ = []  # type: ignore[attr-defined]
    parser_package = types.ModuleType("app.modules.parser")
    parser_package.__path__ = []  # type: ignore[attr-defined]

    storage_module = types.ModuleType("app.modules.document.storage")
    swagger_module = types.ModuleType("app.modules.parser.swagger_parser")
    prd_module = types.ModuleType("app.modules.parser.prd_parser")
    figma_module = types.ModuleType("app.modules.parser.figma_parser")

    class FakeStorage:
        saved_calls: list[tuple[str, bytes]] = []

        def __init__(self, root: Path) -> None:
            self.root = root

        def save_bytes(self, relative_path: str, payload: bytes) -> str:
            self.saved_calls.append((relative_path, payload))
            return str(self.root / "delegated-artifact.json")

    def fake_extract_operations(payload):
        return [{"path": "/delegated", "method": "get", "summary": payload["marker"]}]

    def fake_extract_prd_sections(text):
        return [{"heading": "Delegated", "body": text}]

    def fake_extract_figma_nodes(payload):
        return [{"id": payload["marker"], "name": "Delegated", "type": "FRAME"}]

    storage_module.LocalArtifactStorage = FakeStorage
    swagger_module.extract_operations = fake_extract_operations
    prd_module.extract_prd_sections = fake_extract_prd_sections
    figma_module.extract_figma_nodes = fake_extract_figma_nodes

    sys.modules["worker_app"] = worker_app_package
    sys.modules["worker_app.celery_app"] = celery_app_module
    sys.modules["app"] = app_package
    sys.modules["app.modules"] = modules_package
    sys.modules["app.modules.document"] = document_package
    sys.modules["app.modules.document.storage"] = storage_module
    sys.modules["app.modules.parser"] = parser_package
    sys.modules["app.modules.parser.swagger_parser"] = swagger_module
    sys.modules["app.modules.parser.prd_parser"] = prd_module
    sys.modules["app.modules.parser.figma_parser"] = figma_module

    spec = importlib.util.spec_from_file_location("worker_parse_module", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_parse_task_delegates_to_api_modules_and_persists_artifact(tmp_path) -> None:
    module = _load_parse_module()

    result = module.parse_document_version(
        7,
        document_type="swagger",
        payload={"marker": "delegated-summary"},
        artifact_root=str(tmp_path),
        artifact_relative_path="artifacts/swagger.json",
    )

    assert result["status"] == "parsed"
    assert result["artifact_path"] == str(tmp_path / "delegated-artifact.json")
    assert result["parsed"] == {
        "operations": [
            {"path": "/delegated", "method": "get", "summary": "delegated-summary"},
        ]
    }


def test_parse_task_source_uses_api_modules_without_sys_path_hack() -> None:
    source = (Path(__file__).resolve().parents[1] / "worker_app" / "tasks" / "parse.py").read_text()

    assert "sys.path" not in source
    assert "from app.modules.document.storage import LocalArtifactStorage" in source
    assert "from app.modules.parser.swagger_parser import extract_operations" in source
