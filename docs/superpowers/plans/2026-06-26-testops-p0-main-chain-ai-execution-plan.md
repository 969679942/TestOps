# TestOps P0 Main Chain AI Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-usable P0 main chain for TestOps: `document upload + system skill package -> parsing -> knowledge context assembly -> Cursor generation -> review -> supplement generation -> publish`.

**Architecture:** Keep the existing modular monolith and upgrade the weakest core path instead of rewriting the product. Add two first-class capabilities, `skills` and `knowledge_context`, and make generation versioned, evidence-based, and additive when reviewers ask for missing scenarios.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Celery, Redis, Next.js, TypeScript, Vitest, pytest

---

## 0. How Another AI Should Execute This

This document is meant to be directly executable by another coding AI.

### Global rules

1. Do not start with automation/report/scheduler work.
   Only the main chain in this plan is in scope.

2. Do not overwrite reviewed or published test cases during supplement generation.

3. Do not implement asset-only generation as the final path.
   Final generation input must be:
   - selected document versions
   - one active skill package version
   - generation mode

4. Do not decode uploaded binary files into UTF-8 strings during version persistence.
   `pdf` and `docx` uploads must remain byte-safe.

5. Keep backward compatibility only when it reduces migration risk.
   Compatibility shims must be explicitly marked as temporary.

### Required execution order

1. Baseline and migration preflight
2. Skill package archive
3. Auto-version upload and parse trigger
4. Rich parsing and knowledge context assembly
5. Version-based grounded generation
6. Traceability, revisions, and review evidence
7. Main-chain UI closure
8. Supplement generation
9. Full verification and docs

### Required regression commands

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests -q
cd D:\Menusifu\TestOps\services\worker
uv run pytest tests -q
cd D:\Menusifu\TestOps\apps\web
npm test
```

---

## 1. Baseline And Migration Preflight

### Objective

Stabilize the execution environment so the rest of the tasks can be run safely and repeatedly.

### Files

- Modify: `README.md`
- Modify: `docs/local-runbook.md`
- Test: `services/api/tests/test_schema_metadata.py`

### Done when

- the current migration head is known
- there is a documented local startup flow for API/worker/web
- the current branch state and remote status are noted in the handoff

- [ ] **Step 1: Capture migration head and baseline status**

Run:

```powershell
cd D:\Menusifu\TestOps
git branch --show-current
git status --short --branch
cd D:\Menusifu\TestOps\services\api
uv run alembic current
```

Expected:

- current branch is identified
- working tree state is visible
- alembic head is known before adding new migrations

- [ ] **Step 2: Add a failing documentation expectation test if missing**

```python
def test_local_runbook_mentions_api_worker_web_stack():
    from pathlib import Path

    content = Path("docs/local-runbook.md").read_text(encoding="utf-8")
    assert "API" in content
    assert "worker" in content
    assert "web" in content
```

- [ ] **Step 3: Run the targeted baseline check**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_schema_metadata.py -q
```

Expected:

- PASS

- [ ] **Step 4: Update docs with current baseline commands**

```markdown
1. Start postgres and redis
2. Run `uv run alembic upgrade head`
3. Start API with `uv run uvicorn app.main:app --reload`
4. Start worker with `uv run celery -A worker_app.celery_app worker -l info -P solo`
5. Start web with `npm run dev`
```

- [ ] **Step 5: Commit**

```powershell
git add README.md docs/local-runbook.md
git commit -m "docs: record P0 baseline runbook"
```

---

## 2. Skill Package Archive

### Objective

Create a system-level, versioned skill package archive inside TestOps.

Each project/system must be able to:

- create a skill package
- create archived versions
- activate one version
- use the active version during generation

### Files

- Create: `services/api/app/models/skill_package.py`
- Create: `services/api/app/models/skill_package_version.py`
- Create: `services/api/app/schemas/skill_package.py`
- Create: `services/api/app/modules/skills/service.py`
- Create: `services/api/app/modules/skills/router.py`
- Modify: `services/api/app/main.py`
- Create: `services/api/tests/test_skill_package_flow.py`
- Create: `services/api/alembic/versions/0017_add_skills_and_generation_traceability.py`

### API target

- `POST /projects/{project_id}/skill-packages`
- `GET /projects/{project_id}/skill-packages`
- `POST /skill-packages/{skill_package_id}/versions`
- `GET /skill-packages/{skill_package_id}/versions`
- `POST /projects/{project_id}/skill-packages/{skill_package_id}/activate/{version_id}`

### Data model target

`SkillPackage`
- `id`
- `project_id`
- `system_key`
- `name`
- `status`
- `active_version_id`
- `created_at`
- `updated_at`

`SkillPackageVersion`
- `id`
- `skill_package_id`
- `version_no`
- `storage_uri`
- `structured_metadata`
- `summary`
- `created_at`

- [ ] **Step 1: Write failing skill-package flow tests**

```python
def test_create_skill_package_and_activate_version(client):
    project = client.post("/projects", json={"name": "OMS", "code": "oms"}).json()

    package = client.post(
        f"/projects/{project['id']}/skill-packages",
        json={"system_key": "oms", "name": "OMS Test Case Skill"},
    )
    assert package.status_code == 201

    version = client.post(
        f"/skill-packages/{package.json()['id']}/versions",
        json={
            "summary": "OMS v1",
            "content": {
                "prompt_template": "Generate OMS cases",
                "scenario_taxonomy": ["happy_path", "boundary", "permission"],
                "review_checklist": ["traceable", "observable"],
            },
        },
    )
    assert version.status_code == 201

    activate = client.post(
        f"/projects/{project['id']}/skill-packages/{package.json()['id']}/activate/{version.json()['id']}"
    )
    assert activate.status_code == 200
    assert activate.json()["active_version_id"] == version.json()["id"]


def test_list_skill_packages_returns_active_version_summary(client):
    project = client.post("/projects", json={"name": "CRM", "code": "crm"}).json()
    ...
    response = client.get(f"/projects/{project['id']}/skill-packages")
    assert response.status_code == 200
    assert response.json()[0]["active_version_summary"] == "CRM v1"
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_skill_package_flow.py -q
```

Expected:

- missing models/routes/schemas

- [ ] **Step 3: Implement the models, schemas, services, and router**

```python
# services/api/app/models/skill_package.py
class SkillPackage(Base):
    __tablename__ = "skill_packages"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    system_key: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    active_version_id: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, onupdate=_utcnow, nullable=False)
```

```python
# services/api/app/models/skill_package_version.py
class SkillPackageVersion(Base):
    __tablename__ = "skill_package_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_package_id: Mapped[int] = mapped_column(ForeignKey("skill_packages.id"), nullable=False)
    version_no: Mapped[int] = mapped_column(nullable=False)
    storage_uri: Mapped[str | None] = mapped_column(Text(), nullable=True)
    structured_metadata: Mapped[dict[str, Any]] = mapped_column(JSON(), default=dict, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
```

```python
# services/api/app/modules/skills/service.py
def activate_skill_package_version(
    session: Session,
    *,
    project_id: int,
    skill_package_id: int,
    version_id: int,
) -> SkillPackage:
    package = ...
    version = ...
    package.active_version_id = version.id
    session.add(package)
    session.commit()
    session.refresh(package)
    return package
```

- [ ] **Step 4: Run tests and migration verification**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_skill_package_flow.py -q
uv run alembic upgrade head
```

Expected:

- PASS
- migration applies cleanly

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/skill_package.py services/api/app/models/skill_package_version.py services/api/app/schemas/skill_package.py services/api/app/modules/skills/service.py services/api/app/modules/skills/router.py services/api/app/main.py services/api/tests/test_skill_package_flow.py services/api/alembic/versions/0017_add_skills_and_generation_traceability.py
git commit -m "feat: add skill package archive"
```

### Task brief for another AI

> Implement a versioned skill package archive in FastAPI/SQLAlchemy. Add models, schemas, routes, service functions, migration, and tests. Activation is project-scoped. Keep the payload simple: `prompt_template`, `scenario_taxonomy`, `review_checklist`, and metadata JSON.

---

## 3. Auto-Version Upload And Parse Trigger

### Objective

Make file upload immediately usable by the main chain.

Uploading a file must:

- create `DocumentAsset`
- create first `DocumentVersion`
- persist artifact bytes safely
- mark parse as queued
- dispatch parse automatically

### Files

- Modify: `services/api/app/models/document.py`
- Modify: `services/api/app/schemas/document.py`
- Modify: `services/api/app/modules/document/service.py`
- Modify: `services/api/app/modules/document/router.py`
- Modify: `services/api/tests/test_document_upload_flow.py`

### Constraint

Do not use `raw.decode("utf-8")` for uploaded binaries.

- [ ] **Step 1: Write failing upload tests**

```python
def test_upload_document_file_creates_asset_and_first_version(client, monkeypatch, tmp_path):
    from app.modules.document import service as document_service

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
        files={"file": ("checkout.md", b"# Checkout\\n\\n## Submit order", "text/markdown")},
    )

    assert response.status_code == 201
    document = response.json()
    versions = client.get(f"/documents/{document['id']}/versions")
    assert versions.status_code == 200
    assert len(versions.json()) == 1
    assert versions.json()[0]["parse_status"] == "queued"
    assert dispatched == [versions.json()[0]["id"]]


def test_upload_docx_keeps_binary_artifact_intact(client, monkeypatch, tmp_path):
    from app.modules.document import service as document_service

    monkeypatch.setattr(document_service.settings, "document_storage_path", str(tmp_path / "docs"))
    monkeypatch.setattr(document_service.settings, "artifact_storage_root", str(tmp_path / "artifacts"))
    monkeypatch.setattr(document_service, "dispatch_parse_document_version", lambda version_id: None)
    project = client.post("/projects", json={"name": "DOCX", "code": "docx"}).json()

    raw_docx = b"PK\\x03\\x04fake-docx-content"
    response = client.post(
        f"/projects/{project['id']}/documents/upload",
        data={"type": "prd", "name": "DOCX PRD", "source_mode": "upload"},
        files={"file": ("checkout.docx", raw_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )

    document = response.json()
    version = client.get(f"/documents/{document['id']}/versions").json()[0]
    with open(version["storage_path"], "rb") as fh:
        assert fh.read() == raw_docx
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_upload_flow.py -q
```

Expected:

- upload returns asset-only behavior
- binary version persistence is missing or unsafe

- [ ] **Step 3: Implement binary-safe version creation**

```python
# services/api/app/modules/document/service.py
def create_uploaded_binary_version(
    session: Session,
    *,
    document_id: int,
    filename: str,
    raw_bytes: bytes,
    source_uri: str | None,
) -> DocumentVersion:
    asset = _get_document_asset(session, document_id)
    version_no = _next_version_no(session, document_id)
    checksum = sha256(raw_bytes).hexdigest()
    relative_path = str(
        Path("projects") / str(asset.project_id) / "documents" / str(asset.id) / f"v{version_no}" / _safe_filename(filename, f"document-{document_id}.bin")
    )
    storage = LocalArtifactStorage(Path(settings.artifact_storage_root))
    storage_path = storage.save_bytes(relative_path, raw_bytes)
    version = DocumentVersion(
        document_asset_id=document_id,
        version_no=version_no,
        storage_path=storage_path,
        checksum=checksum,
        source_uri=source_uri,
        parse_status="uploaded",
        structured_metadata={},
    )
    session.add(version)
    session.commit()
    session.refresh(version)
    return version
```

```python
# services/api/app/modules/document/service.py
async def upload_asset_file(...):
    ...
    asset = DocumentAsset(...)
    session.add(asset)
    session.commit()
    session.refresh(asset)

    version = create_uploaded_binary_version(
        session,
        document_id=asset.id,
        filename=original_name,
        raw_bytes=raw,
        source_uri=None,
    )
    version.parse_status = "queued"
    ...
```

- [ ] **Step 4: Re-run tests**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_upload_flow.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/document.py services/api/app/schemas/document.py services/api/app/modules/document/service.py services/api/app/modules/document/router.py services/api/tests/test_document_upload_flow.py
git commit -m "feat: auto-version uploaded documents"
```

### Task brief for another AI

> Upgrade upload flow so it creates a first document version and immediately queues parsing. Keep uploaded file bytes intact for `pdf/docx`. Do not convert binary uploads into strings.

---

## 4. Rich Parsing And Knowledge Context Assembly

### Objective

Convert parsed document versions plus active skill package into one generation-ready context bundle.

### Files

- Modify: `services/api/app/modules/parser/prd_parser.py`
- Modify: `services/api/app/modules/parser/swagger_parser.py`
- Modify: `services/worker/worker_app/tasks/parse.py`
- Create: `services/api/app/modules/knowledge_context/__init__.py`
- Create: `services/api/app/modules/knowledge_context/service.py`
- Modify: `services/api/tests/test_document_parsing_context_flow.py`
- Modify: `services/worker/tests/test_parse_task.py`

### Required parse output

For `prd`:
- `sections`
- `acceptance_criteria`
- `field_definitions`
- `user_actions`

For `business_rule`:
- `rules`
- `conditions`
- `outcomes`
- `constraints`

For `supplement`:
- `clarifications`
- `glossary`
- `open_questions`

### Required context bundle shape

```python
{
    "project_id": 1,
    "document_versions": [101, 102],
    "prd_sections": [...],
    "business_rules": [...],
    "supplements": [...],
    "swagger_hints": [...],
    "figma_hints": [...],
    "ambiguities": [...],
    "skill_package": {
        "id": 21,
        "summary": "OMS v1",
        "scenario_taxonomy": ["happy_path", "boundary"],
        "review_checklist": ["traceable", "observable"],
    },
}
```

- [ ] **Step 1: Write failing parser/context tests**

```python
def test_parse_task_extracts_prd_business_rule_and_supplement_shapes():
    from worker_app.tasks.parse import _parse_payload

    prd = _parse_payload("prd", "# Checkout\\n\\n## Acceptance Criteria\\n- Order is created")
    rule = _parse_payload("business_rule", "IF user is blocked THEN submit is denied")
    supplement = _parse_payload("supplement", "Clarification: guest checkout is disabled")

    assert "sections" in prd
    assert "acceptance_criteria" in prd
    assert "rules" in rule
    assert "clarifications" in supplement


def test_build_generation_context_groups_selected_versions_and_active_skill_package(db_session):
    from app.modules.knowledge_context.service import build_generation_context
    ...
    context = build_generation_context(
        db_session,
        project_id=project.id,
        version_ids=[prd_version.id, rule_version.id],
        skill_version_id=skill_version.id,
    )
    assert context["project_id"] == project.id
    assert context["document_versions"] == [prd_version.id, rule_version.id]
    assert len(context["prd_sections"]) == 1
    assert len(context["business_rules"]) == 1
    assert context["skill_package"]["scenario_taxonomy"] == ["happy_path", "boundary"]
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_parsing_context_flow.py -q
cd D:\Menusifu\TestOps\services\worker
uv run pytest tests/test_parse_task.py -q
```

Expected:

- missing context service
- parse payload too shallow

- [ ] **Step 3: Implement parser enrichments and context service**

```python
# services/api/app/modules/parser/prd_parser.py
def extract_prd_sections(text: str) -> dict[str, list[dict[str, str]]]:
    sections: list[dict[str, str]] = []
    acceptance_criteria: list[dict[str, str]] = []
    field_definitions: list[dict[str, str]] = []
    user_actions: list[dict[str, str]] = []
    ...
    return {
        "sections": sections,
        "acceptance_criteria": acceptance_criteria,
        "field_definitions": field_definitions,
        "user_actions": user_actions,
    }
```

```python
# services/worker/worker_app/tasks/parse.py
if normalized_type == "business_rule":
    return {
        "rules": [
            {"text": line.strip(), "source_kind": "rule"}
            for line in str(payload).splitlines()
            if line.strip()
        ],
        "conditions": [],
        "outcomes": [],
        "constraints": [],
    }
```

```python
# services/api/app/modules/knowledge_context/service.py
def build_generation_context(
    session: Session,
    *,
    project_id: int,
    version_ids: list[int],
    skill_version_id: int,
) -> dict[str, Any]:
    versions = ...
    skill_version = ...
    return {
        "project_id": project_id,
        "document_versions": version_ids,
        "prd_sections": prd_sections,
        "business_rules": business_rules,
        "supplements": supplements,
        "swagger_hints": swagger_hints,
        "figma_hints": figma_hints,
        "ambiguities": ambiguities,
        "skill_package": {
            "id": skill_version.id,
            "summary": skill_version.summary,
            "scenario_taxonomy": skill_version.structured_metadata.get("scenario_taxonomy", []),
            "review_checklist": skill_version.structured_metadata.get("review_checklist", []),
        },
    }
```

- [ ] **Step 4: Re-run tests**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_parsing_context_flow.py -q
cd D:\Menusifu\TestOps\services\worker
uv run pytest tests/test_parse_task.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/modules/parser/prd_parser.py services/api/app/modules/parser/swagger_parser.py services/worker/worker_app/tasks/parse.py services/api/app/modules/knowledge_context/__init__.py services/api/app/modules/knowledge_context/service.py services/api/tests/test_document_parsing_context_flow.py services/worker/tests/test_parse_task.py
git commit -m "feat: add knowledge context assembly"
```

### Task brief for another AI

> Enrich parse output for `prd`, `business_rule`, and `supplement`, then add a `knowledge_context` service that merges selected document versions with an active skill package version into one provider-ready bundle.

---

## 5. Version-Based Grounded Generation

### Objective

Make generation use:

- selected document versions
- selected skill package version
- generation mode

Persist:

- raw provider response
- normalized payload
- validation report

### Files

- Modify: `services/api/app/models/generation.py`
- Create: `services/api/app/models/generation_output.py`
- Modify: `services/api/app/schemas/generation.py`
- Modify: `services/api/app/modules/generation/service.py`
- Modify: `services/api/app/modules/generation/router.py`
- Modify: `services/api/app/modules/provider/base.py`
- Modify: `services/api/app/modules/provider/cursor_provider.py`
- Modify: `services/api/app/modules/provider/openai_provider.py`
- Modify: `services/api/tests/test_generation_validation.py`
- Modify: `services/api/tests/test_generation_flow.py`
- Create: `services/api/tests/test_generation_output_flow.py`

### Generation request target

```json
{
  "provider": "cursor",
  "prompt_profile": "default",
  "input_document_version_ids": [101, 102],
  "input_skill_version_id": 21,
  "generation_mode": "full",
  "prompt_optimization_note": null
}
```

- [ ] **Step 1: Write failing generation tests**

```python
def test_create_generation_task_uses_document_version_ids_and_skill_version(client, monkeypatch):
    from app.modules.generation import service as generation_service

    monkeypatch.setattr(generation_service, "dispatch_generation_task", lambda task_id: None)
    project = client.post("/projects", json={"name": "Gen", "code": "gen"}).json()

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "default",
            "input_document_version_ids": [11, 12],
            "input_skill_version_id": 21,
            "generation_mode": "full",
        },
    )

    assert response.status_code == 201
    assert response.json()["input_refs"]["document_version_ids"] == [11, 12]
    assert response.json()["input_refs"]["skill_version_id"] == 21


def test_execute_generation_task_persists_generation_output(...):
    ...
    output = client.get(f"/generation-tasks/{task_id}/output")
    assert output.status_code == 200
    assert output.json()["validation_report"]["status"] in {"completed", "partial_completed"}
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_generation_validation.py tests/test_generation_flow.py tests/test_generation_output_flow.py -q
```

Expected:

- schema mismatch
- no generation output table/route
- provider request lacks context bundle

- [ ] **Step 3: Implement grounded generation**

```python
# services/api/app/modules/provider/base.py
@dataclass(slots=True, frozen=True)
class ProviderGenerationRequest:
    project_id: int
    prompt_version: str
    input_refs: Mapping[str, Any] = field(default_factory=dict)
    context_bundle: Mapping[str, Any] = field(default_factory=dict)
```

```python
# services/api/app/modules/generation/service.py
task = GenerationTask(
    project_id=project_id,
    status="queued",
    provider=provider.name,
    model=provider.model,
    prompt_version=provider.prompt_version,
    input_refs={
        "document_version_ids": payload.input_document_version_ids,
        "skill_version_id": payload.input_skill_version_id,
        "generation_mode": payload.generation_mode,
    },
)
...
context_bundle = knowledge_context_service.build_generation_context(
    session,
    project_id=task.project_id,
    version_ids=task.input_refs["document_version_ids"],
    skill_version_id=task.input_refs["skill_version_id"],
)
```

```python
# services/api/app/modules/provider/cursor_provider.py
def _build_prompt(request: ProviderGenerationRequest) -> str:
    return "\n".join(
        [
            "You are generating QA test case drafts for the TestOps platform.",
            "Return only JSON.",
            json.dumps({"schema": "testops-p0-v1"}, ensure_ascii=False),
            f"Prompt profile: {request.prompt_version}",
            f"Context bundle: {json.dumps(dict(request.context_bundle), ensure_ascii=False)}",
            "Use the scenario taxonomy and review checklist from the skill package.",
        ]
    )
```

- [ ] **Step 4: Re-run tests**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_generation_validation.py tests/test_generation_flow.py tests/test_generation_output_flow.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/generation.py services/api/app/models/generation_output.py services/api/app/schemas/generation.py services/api/app/modules/generation/service.py services/api/app/modules/generation/router.py services/api/app/modules/provider/base.py services/api/app/modules/provider/cursor_provider.py services/api/app/modules/provider/openai_provider.py services/api/tests/test_generation_validation.py services/api/tests/test_generation_flow.py services/api/tests/test_generation_output_flow.py
git commit -m "feat: ground generation on documents and skills"
```

### Task brief for another AI

> Replace asset-id generation with version-based generation grounded on knowledge context plus skill package version. Persist raw/normalized/validation output. Keep `openai_provider.py` contract-compatible even if runtime is still stubbed.

---

## 6. Traceability, Revisions, And Review Evidence

### Objective

Make generated cases maintainable and reviewable.

Each case must expose:

- source refs
- generation task id
- revision history
- scenario category
- origin mode

### Files

- Modify: `services/api/app/models/testcase.py`
- Create: `services/api/app/models/testcase_revision.py`
- Modify: `services/api/app/schemas/testcase.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/testcase/router.py`
- Modify: `services/api/app/modules/review/service.py`
- Modify: `services/api/tests/test_testcase_review_flow.py`

- [ ] **Step 1: Write failing traceability tests**

```python
def test_generated_test_case_exposes_source_refs_and_generation_link(client, monkeypatch):
    ...
    listed = client.get(f"/projects/{project['id']}/test-cases")
    body = listed.json()[0]
    assert body["source_refs"][0]["document_type"] == "prd"
    assert body["generation_task_id"] == generation_task_id


def test_test_case_revision_history_is_created_for_ai_generated_case(...):
    revisions = client.get(f"/test-cases/{test_case_id}/revisions")
    assert revisions.status_code == 200
    assert revisions.json()[0]["source_type"] == "ai_generated"
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_testcase_review_flow.py -q
```

Expected:

- missing source refs
- missing revisions endpoint/history

- [ ] **Step 3: Implement traceability and revisions**

```python
# services/api/app/models/testcase.py
class TestCase(Base):
    ...
    source_refs: Mapped[list[dict[str, Any]]] = mapped_column(JSON(), default=list, nullable=False)
    generation_task_id: Mapped[int | None] = mapped_column(ForeignKey("generation_tasks.id"), nullable=True)
    current_revision_id: Mapped[int | None] = mapped_column(nullable=True)
    scenario_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origin_mode: Mapped[str] = mapped_column(String(32), default="full", nullable=False)
```

```python
# services/api/app/modules/testcase/service.py
def create_revision(...):
    ...

def persist_generated_cases(...):
    draft = TestCase(
        ...,
        source_refs=item.get("source_refs", []),
        generation_task_id=generation_task_id,
        scenario_category=item.get("scenario_category"),
        origin_mode=item.get("origin_mode", "full"),
    )
    ...
```

- [ ] **Step 4: Re-run tests**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_testcase_review_flow.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/testcase.py services/api/app/models/testcase_revision.py services/api/app/schemas/testcase.py services/api/app/modules/testcase/service.py services/api/app/modules/testcase/router.py services/api/app/modules/review/service.py services/api/tests/test_testcase_review_flow.py
git commit -m "feat: add testcase traceability and revisions"
```

### Task brief for another AI

> Add source refs, scenario category, origin mode, generation task linkage, and revision history to test cases. Make review evidence inspectable through API.

---

## 7. Main-Chain UI Closure

### Objective

Close the operator loop in the web app.

The user must be able to:

- upload documents
- inspect versions and parse status
- manage system skill packages
- choose parsed versions and active skill package
- review evidence

### Files

- Modify: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/page.tsx`
- Create: `apps/web/app/projects/[projectId]/skills/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/review/page.tsx`
- Modify: `apps/web/components/document-upload-panel.tsx`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/workspace-api.ts`
- Modify: `apps/web/src/tests/pages.test.tsx`
- Modify: `apps/web/src/tests/api.test.ts`

- [ ] **Step 1: Write failing UI/API tests**

```tsx
it("renders document center with versions and parse summaries", async () => {
  ...
  expect(html).toContain("1 acceptance criterion");
});

it("renders project skill packages with active version", async () => {
  ...
  expect(html).toContain("OMS Test Case Skill");
  expect(html).toContain("OMS v1");
});

it("posts generation requests using document version ids and skill version id", async () => {
  ...
  await createGenerationTask("7", {
    input_document_version_ids: [100, 101],
    input_skill_version_id: 21,
    generation_mode: "full",
    provider: "cursor",
  });
  ...
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\apps\web
npm test -- src/tests/pages.test.tsx src/tests/api.test.ts
```

Expected:

- documents page still redirects
- no skills page
- generation request shape does not match new backend

- [ ] **Step 3: Implement real main-chain UI**

```tsx
// apps/web/app/projects/[projectId]/documents/page.tsx
export default async function ProjectDocumentsPage({ params }: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  ...
  return (
    <AppShell currentPath={`/projects/${projectId}/documents`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Document Center</span>
        <h2>{project.name}</h2>
        <p>Manage document assets, versions, and parse output.</p>
      </section>
      <DocumentTable items={documents} />
    </AppShell>
  );
}
```

```tsx
// apps/web/app/projects/[projectId]/skills/page.tsx
export default async function ProjectSkillsPage(...) {
  ...
  return (
    <AppShell currentPath={`/projects/${projectId}/skills`} project={project}>
      <section className="page-header">
        <span className="eyebrow">Skill Packages</span>
        <h2>{project.name}</h2>
        <p>Archive and activate system-specific generation skills.</p>
      </section>
    </AppShell>
  );
}
```

```ts
// apps/web/lib/api.ts
export async function createGenerationTask(projectId: string, input: {
  input_document_version_ids: number[];
  input_skill_version_id: number;
  generation_mode: "full" | "supplement";
  provider?: string | null;
  model?: string | null;
  prompt_profile?: string | null;
  prompt_optimization_note?: string | null;
}) { ... }
```

- [ ] **Step 4: Re-run tests**

Run:

```powershell
cd D:\Menusifu\TestOps\apps\web
npm test -- src/tests/pages.test.tsx src/tests/api.test.ts
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```powershell
git add apps/web/app/projects/[projectId]/documents/page.tsx apps/web/app/projects/[projectId]/page.tsx apps/web/app/projects/[projectId]/skills/page.tsx apps/web/app/projects/[projectId]/generation-tasks/page.tsx apps/web/app/projects/[projectId]/review/page.tsx apps/web/components/document-upload-panel.tsx apps/web/lib/api.ts apps/web/lib/types.ts apps/web/lib/workspace-api.ts apps/web/src/tests/pages.test.tsx apps/web/src/tests/api.test.ts
git commit -m "feat: close main-chain UI workflow"
```

### Task brief for another AI

> Replace redirect-only pages with real main-chain pages. Add a skill-package management screen, generation selection based on parsed versions + active skill package, and evidence visibility in review.

---

## 8. Supplement Generation

### Objective

Allow reviewers to optimize the prompt and ask AI to fill missing scenarios without replacing reviewed content.

### Files

- Modify: `services/api/app/models/generation.py`
- Modify: `services/api/app/schemas/generation.py`
- Modify: `services/api/app/modules/generation/service.py`
- Modify: `services/api/app/modules/review/service.py`
- Create: `services/api/tests/test_generation_supplement_flow.py`
- Modify: `services/api/tests/test_testcase_review_flow.py`
- Modify: `apps/web/app/projects/[projectId]/review/page.tsx`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/src/tests/pages.test.tsx`

### Required behavior

- `generation_mode = full` for initial run
- `generation_mode = supplement` for missing scenario fill
- supplement run can accept `prompt_optimization_note`
- supplement run can reference `parent_generation_task_id`
- supplement persistence is additive, not destructive

- [ ] **Step 1: Write failing supplement-generation tests**

```python
def test_supplement_generation_creates_additive_cases_without_overwriting_reviewed_cases(client, monkeypatch):
    ...
    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "mock",
            "generation_mode": "supplement",
            "parent_generation_task_id": first_task_id,
            "input_document_version_ids": [prd_version_id, rule_version_id],
            "input_skill_version_id": skill_version_id,
            "prompt_optimization_note": "补充权限不足、状态流转回退、重复提交场景",
        },
    )
    assert response.status_code == 201
    assert response.json()["input_refs"]["generation_mode"] == "supplement"
```

```tsx
it("shows supplement generation controls in review page", async () => {
  ...
  expect(html).toContain("补全场景并重新生成");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_generation_supplement_flow.py tests/test_testcase_review_flow.py -q
cd D:\Menusifu\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

Expected:

- missing fields and review action

- [ ] **Step 3: Implement supplement-generation flow**

```python
# services/api/app/modules/generation/service.py
if payload.generation_mode == "supplement":
    baseline_cases = list_existing_cases_for_generation_parent(...)
    context_bundle["existing_cases"] = baseline_cases
    context_bundle["supplement_request"] = {
        "prompt_optimization_note": payload.prompt_optimization_note,
        "mode": "supplement",
    }
```

```tsx
// apps/web/app/projects/[projectId]/review/page.tsx
<form action={submitSupplementGeneration}>
  <textarea
    name="promptOptimizationNote"
    placeholder="描述缺失场景、期望补全的维度、禁止重复的内容"
  />
  <button type="submit">补全场景并重新生成</button>
</form>
```

- [ ] **Step 4: Re-run tests**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_generation_supplement_flow.py tests/test_testcase_review_flow.py -q
cd D:\Menusifu\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/generation.py services/api/app/schemas/generation.py services/api/app/modules/generation/service.py services/api/app/modules/review/service.py services/api/tests/test_generation_supplement_flow.py services/api/tests/test_testcase_review_flow.py apps/web/app/projects/[projectId]/review/page.tsx apps/web/lib/api.ts apps/web/src/tests/pages.test.tsx
git commit -m "feat: add supplement generation workflow"
```

### Task brief for another AI

> Add supplement generation so reviewers can describe missing scenarios and trigger an additive AI rerun. Never overwrite reviewed/published cases. Treat the rerun as a child generation task.

---

## 9. Full Verification And Handoff Docs

### Objective

Prove the new P0 main chain works end to end and document how to operate it.

### Files

- Create: `services/api/tests/test_main_chain_p0_flow.py`
- Modify: `README.md`
- Modify: `docs/local-runbook.md`

### Golden flow

1. Create project
2. Create skill package and activate version
3. Upload PRD
4. Upload business rule document
5. Upload supplement document
6. Parse all
7. Generate full case set
8. Review source refs
9. Trigger supplement generation
10. Publish approved cases

- [ ] **Step 1: Write the end-to-end main-chain test**

```python
def test_p0_main_chain_flow(client, monkeypatch):
    from app.modules.document import service as document_service
    from app.modules.generation import service as generation_service

    monkeypatch.setattr(document_service, "dispatch_parse_document_version", lambda version_id: None)
    monkeypatch.setattr(generation_service, "dispatch_generation_task", lambda task_id: None)

    project = client.post("/projects", json={"name": "P0 Flow", "code": "p0-flow"}).json()
    package = client.post(f"/projects/{project['id']}/skill-packages", json={"system_key": "oms", "name": "OMS Skill"}).json()
    skill_version = client.post(
        f"/skill-packages/{package['id']}/versions",
        json={"summary": "OMS v1", "content": {"scenario_taxonomy": ["happy_path"]}},
    ).json()
    client.post(f"/projects/{project['id']}/skill-packages/{package['id']}/activate/{skill_version['id']}")
    ...
    generation = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "mock",
            "input_document_version_ids": [prd_version_id, rule_version_id, supplement_version_id],
            "input_skill_version_id": skill_version["id"],
            "generation_mode": "full",
        },
    )
    assert generation.status_code == 201
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_main_chain_p0_flow.py -q
```

Expected:

- any remaining cross-module gaps surface here

- [ ] **Step 3: Patch last-mile issues and update docs**

```markdown
1. Start postgres and redis
2. Apply migrations
3. Start API, worker, and web
4. Create a project
5. Create and activate a system skill package version
6. Upload PRD, business-rule, and supplement files
7. Wait for parsing
8. Generate full case set
9. Review evidence
10. Trigger supplement generation if needed
11. Publish approved cases
```

- [ ] **Step 4: Run full regression**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests -q
cd D:\Menusifu\TestOps\services\worker
uv run pytest tests -q
cd D:\Menusifu\TestOps\apps\web
npm test
```

Expected:

- all tests PASS

- [ ] **Step 5: Commit**

```powershell
git add services/api/tests/test_main_chain_p0_flow.py README.md docs/local-runbook.md
git commit -m "test: verify P0 main-chain flow"
```

### Task brief for another AI

> Write one golden end-to-end test for the whole main chain and update operator docs so a teammate can run the system locally without tribal knowledge.

---

## 10. Acceptance Checklist

Before marking the project complete, verify all of these:

- [ ] Uploading a source file creates a version automatically
- [ ] Parsing is auto-queued after upload
- [ ] `prd`, `business_rule`, and `supplement` are supported
- [ ] A project can archive and activate a skill package version
- [ ] Generation uses document version ids and one skill package version
- [ ] Generation persists raw response, normalized payload, and validation report
- [ ] Generated cases contain source refs
- [ ] Review page shows evidence and inferred markers
- [ ] Review page can trigger supplement generation
- [ ] Supplement generation is additive
- [ ] Published cases are protected from supplement overwrite
- [ ] Full regression passes

---

## 11. Handoff Prompts For Other AI

Use one of these prompts when dispatching work.

### Prompt A: Single-task execution

```text
You are implementing one task from the TestOps P0 Main Chain AI Execution Plan.
Read D:\\Menusifu\\TestOps\\docs\\superpowers\\plans\\2026-06-26-testops-p0-main-chain-ai-execution-plan.md.
Execute only Task <N>.
Follow TDD strictly:
1. write failing tests,
2. run targeted tests and confirm failure,
3. implement minimal passing code,
4. rerun targeted tests,
5. report changed files, commands run, and remaining risks.
Do not start later tasks.
```

### Prompt B: Review-only pass

```text
Review the implementation for Task <N> against D:\\Menusifu\\TestOps\\docs\\superpowers\\plans\\2026-06-26-testops-p0-main-chain-ai-execution-plan.md.
Focus on:
- missing behavior
- logic regressions
- binary/file-safety issues
- traceability gaps
- supplement-generation overwrite risks
- missing tests
Return findings ordered by severity with exact file references.
```

### Prompt C: Integration pass

```text
Validate the interaction between completed Tasks <A>-<B> using D:\\Menusifu\\TestOps\\docs\\superpowers\\plans\\2026-06-26-testops-p0-main-chain-ai-execution-plan.md.
Do not implement new scope.
Check API contracts, payload shapes, persistence fields, and test coverage across module boundaries.
```

---

## Self-Review

### Spec coverage

- skill package archive: covered by Task 2
- upload/version/parse gap: covered by Task 3
- parsing and knowledge context: covered by Task 4
- grounded generation: covered by Task 5
- traceability and evidence: covered by Task 6
- UI closure: covered by Task 7
- supplement generation: covered by Task 8
- end-to-end maturity and docs: covered by Task 9

### Placeholder scan

- no `TBD`
- no `TODO`
- no “write tests later”
- every task has exact files, commands, and completion criteria

### Type consistency

- generation input consistently uses `input_document_version_ids` plus `input_skill_version_id`
- supplement generation consistently uses `generation_mode`
- traceability fields introduced in Task 6 are consumed by Task 7 and Task 8

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-26-testops-p0-main-chain-ai-execution-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
