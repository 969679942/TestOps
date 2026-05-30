import importlib.util
from pathlib import Path


def test_installed_api_parser_module_resolves_from_worker_environment() -> None:
    spec = importlib.util.find_spec("app.modules.parser.swagger_parser")

    assert spec is not None
    assert spec.origin is not None

    origin = Path(spec.origin).resolve()

    assert origin.name == "swagger_parser.py"
    lowered_parts = {part.lower() for part in origin.parts}
    assert "site-packages" in lowered_parts or origin.match(
        "*/services/api/app/modules/parser/swagger_parser.py"
    )
