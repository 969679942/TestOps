from pathlib import Path
import tomllib


def test_api_pyproject_packages_only_app_module() -> None:
    pyproject_path = Path(__file__).resolve().parents[2] / "api" / "pyproject.toml"
    pyproject = tomllib.loads(pyproject_path.read_text())

    assert pyproject["build-system"]["build-backend"] == "setuptools.build_meta"
    assert any(
        requirement.startswith("setuptools")
        for requirement in pyproject["build-system"]["requires"]
    )
    assert pyproject["tool"]["setuptools"]["packages"]["find"]["include"] == ["app*"]
    assert "alembic*" in pyproject["tool"]["setuptools"]["packages"]["find"]["exclude"]
