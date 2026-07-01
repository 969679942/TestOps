from __future__ import annotations

import hashlib
from pathlib import Path

from app.modules.document import service as document_service


def test_create_uploaded_document_version_stores_artifact(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path))
    project = client.post("/projects", json={"name": "Docs", "code": "docs"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "swagger",
            "name": "Checkout API",
            "source_mode": "upload",
            "source_uri": None,
        },
    ).json()

    payload = '{"openapi":"3.0.0","paths":{}}'
    response = client.post(
        f"/documents/{document['id']}/versions",
        json={
            "filename": "checkout.json",
            "content": payload,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["document_asset_id"] == document["id"]
    assert body["version_no"] == 1
    assert body["parse_status"] == "uploaded"
    assert body["checksum"] == hashlib.sha256(payload.encode("utf-8")).hexdigest()
    assert Path(body["storage_path"]).read_text(encoding="utf-8") == payload


def test_create_url_document_version_records_source_without_artifact(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path))
    monkeypatch.setattr(
        document_service,
        "dispatch_parse_document_version",
        lambda version_id: "Parse dispatch could not reach the broker.",
    )
    project = client.post("/projects", json={"name": "URL Docs", "code": "url-docs"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "swagger",
            "name": "Checkout API",
            "source_mode": "url",
            "source_uri": "https://example.test/openapi.json",
        },
    ).json()

    response = client.post(
        f"/documents/{document['id']}/versions",
        json={
            "source_uri": "https://example.test/openapi.json",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["version_no"] == 2
    assert body["storage_path"] is None
    assert body["checksum"] is None
    assert body["source_uri"] == "https://example.test/openapi.json"


def test_list_document_versions_returns_version_history(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path))
    project = client.post("/projects", json={"name": "History", "code": "history"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": None,
        },
    ).json()
    client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "prd-v1.md", "content": "# v1"},
    )
    client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "prd-v2.md", "content": "# v2"},
    )

    response = client.get(f"/documents/{document['id']}/versions")

    assert response.status_code == 200
    assert [item["version_no"] for item in response.json()] == [1, 2]


def test_parse_document_version_marks_version_queued(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path))
    monkeypatch.setattr(document_service, "dispatch_parse_document_version", lambda version_id: None)
    project = client.post("/projects", json={"name": "Parse", "code": "parse"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": None,
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "checkout.md", "content": "# Checkout"},
    ).json()

    response = client.post(f"/document-versions/{version['id']}/parse")

    assert response.status_code == 200
    assert response.json()["id"] == version["id"]
    assert response.json()["parse_status"] == "queued"
    assert response.json()["parse_summary"] is None


def test_parse_document_version_records_dispatch_issue(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path))
    monkeypatch.setattr(
        document_service,
        "dispatch_parse_document_version",
        lambda version_id: "Parse dispatch could not reach the broker.",
    )
    project = client.post("/projects", json={"name": "Parse Fail", "code": "parse-fail"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Checkout PRD",
            "source_mode": "upload",
            "source_uri": None,
        },
    ).json()
    version = client.post(
        f"/documents/{document['id']}/versions",
        json={"filename": "checkout.md", "content": "# Checkout"},
    ).json()

    response = client.post(f"/document-versions/{version['id']}/parse")

    assert response.status_code == 200
    assert response.json()["parse_status"] == "failed"
    assert response.json()["parse_summary"] == "Parse dispatch could not reach the broker."


def test_upload_document_file_creates_asset_and_first_version(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "document_storage_path", str(tmp_path / "docs"))
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path / "artifacts"))
    dispatched: list[int] = []
    monkeypatch.setattr(
        document_service,
        "dispatch_parse_document_version",
        lambda version_id: dispatched.append(version_id) or None,
    )

    project = client.post("/projects", json={"name": "Upload Flow", "code": "upload-flow"}).json()

    response = client.post(
        f"/projects/{project['id']}/documents/upload",
        data={"type": "prd", "name": "Checkout PRD", "source_mode": "upload"},
        files={"file": ("checkout.md", b"# Checkout\n\n## Submit order", "text/markdown")},
    )

    assert response.status_code == 201
    document = response.json()
    versions = client.get(f"/documents/{document['id']}/versions")
    assert versions.status_code == 200
    assert len(versions.json()) == 1
    assert versions.json()[0]["version_no"] == 1
    assert versions.json()[0]["parse_status"] == "queued"
    assert dispatched == [versions.json()[0]["id"]]


def test_upload_docx_keeps_binary_artifact_intact(client, monkeypatch, tmp_path):
    monkeypatch.setattr(document_service.settings, "document_storage_path", str(tmp_path / "docs"))
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path / "artifacts"))
    monkeypatch.setattr(document_service, "dispatch_parse_document_version", lambda version_id: None)
    project = client.post("/projects", json={"name": "DOCX", "code": "docx"}).json()

    raw_docx = b"PK\x03\x04fake-docx-content"
    response = client.post(
        f"/projects/{project['id']}/documents/upload",
        data={"type": "prd", "name": "DOCX PRD", "source_mode": "upload"},
        files={
            "file": (
                "checkout.docx",
                raw_docx,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 201
    document = response.json()
    version = client.get(f"/documents/{document['id']}/versions").json()[0]
    with open(version["storage_path"], "rb") as fh:
        assert fh.read() == raw_docx


def test_create_document_asset_accepts_business_rule_and_supplement(client):
    project = client.post("/projects", json={"name": "Types", "code": "types"}).json()

    for doc_type in ["business_rule", "supplement"]:
        response = client.post(
            f"/projects/{project['id']}/documents",
            json={
                "type": doc_type,
                "name": doc_type,
                "source_mode": "upload",
                "source_uri": f"{doc_type}.md",
            },
        )
        assert response.status_code == 201
        assert response.json()["type"] == doc_type


def test_create_url_document_asset_creates_first_version_and_queues_parse(
    client,
    monkeypatch,
    tmp_path,
):
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path / "artifacts"))
    dispatched: list[int] = []
    monkeypatch.setattr(
        document_service,
        "dispatch_parse_document_version",
        lambda version_id: dispatched.append(version_id) or None,
    )

    project = client.post("/projects", json={"name": "Swagger URL", "code": "swagger-url"}).json()

    response = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "swagger",
            "name": "Checkout API",
            "source_mode": "url",
            "source_uri": "https://example.test/openapi.json",
        },
    )

    assert response.status_code == 201
    document = response.json()
    assert document["parse_status"] == "queued"

    versions = client.get(f"/documents/{document['id']}/versions")
    assert versions.status_code == 200
    assert len(versions.json()) == 1
    assert versions.json()[0]["version_no"] == 1
    assert versions.json()[0]["source_uri"] == "https://example.test/openapi.json"
    assert versions.json()[0]["parse_status"] == "queued"
    assert dispatched == [versions.json()[0]["id"]]
