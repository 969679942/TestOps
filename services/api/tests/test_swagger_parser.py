from app.modules.parser.swagger_parser import (
    extract_operations,
    extract_setup_candidates,
)


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


def test_extract_setup_candidates_from_openapi_request_body() -> None:
    payload = {
        "openapi": "3.0.0",
        "paths": {
            "/orders": {
                "post": {
                    "summary": "Create order",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["customer_id", "items"],
                                    "properties": {
                                        "customer_id": {"type": "string"},
                                        "items": {"type": "array"},
                                    },
                                }
                            }
                        }
                    },
                }
            },
            "/orders/{order_id}": {
                "get": {
                    "summary": "Read order",
                }
            },
        },
    }

    candidates = extract_setup_candidates(payload)

    assert candidates == [
        {
            "path": "/orders",
            "method": "post",
            "summary": "Create order",
            "request_schema": {
                "type": "object",
                "required": ["customer_id", "items"],
                "properties": {
                    "customer_id": {"type": "string"},
                    "items": {"type": "array"},
                },
            },
            "required_parameters": ["customer_id", "items"],
        }
    ]
