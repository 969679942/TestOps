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

    sys.modules["worker_app"] = worker_app_package
    sys.modules["worker_app.celery_app"] = celery_app_module

    spec = importlib.util.spec_from_file_location("worker_parse_module", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_parse_task_is_self_contained_and_persists_artifact(tmp_path) -> None:
    module = _load_parse_module()

    result = module.parse_document_version(
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


def test_parse_task_source_has_no_cross_service_import_hack() -> None:
    source = (Path(__file__).resolve().parents[1] / "worker_app" / "tasks" / "parse.py").read_text()

    assert "sys.path" not in source
    assert "app.modules" not in source
