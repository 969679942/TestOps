from app.modules.parser.swagger_parser import extract_operations


def test_extract_openapi_operations() -> None:
    payload = {
        "openapi": "3.0.0",
        "paths": {
            "/orders": {
                "post": {
                    "summary": "Create order",
                }
            }
        },
    }

    operations = extract_operations(payload)

    assert operations == [
        {"path": "/orders", "method": "post", "summary": "Create order"},
    ]
