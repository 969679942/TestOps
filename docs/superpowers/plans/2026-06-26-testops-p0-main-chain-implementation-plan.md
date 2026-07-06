# TestOps P0 Main Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TestOps mature enough for repeated internal use on the main chain `document upload + system skill package -> knowledge extraction -> Cursor generation -> review -> supplement generation -> publish`.

**Architecture:** Keep the current modular monolith and strengthen the weakest links instead of rewriting the product. Extend the `document`, `parser`, `generation`, `provider`, `testcase`, `review`, and `settings` modules, and add focused `knowledge_context` and `skills` capabilities so generation is grounded on versioned documents plus a versioned system skill package.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Celery, Redis, Next.js, TypeScript, Vitest, pytest

---

## File Structure

### Backend files to modify

- Modify: `services/api/app/models/document.py`
  Responsibility: extend document type handling and keep version parse lifecycle stable.
- Modify: `services/api/app/models/generation.py`
  Responsibility: extend generation task status/input refs and support generation output linkage.
- Modify: `services/api/app/models/testcase.py`
  Responsibility: add traceability fields and revision linkage.
- Modify: `services/api/app/schemas/document.py`
  Responsibility: expose version-aware upload/read fields and parse summaries.
- Modify: `services/api/app/schemas/generation.py`
  Responsibility: switch generation input from asset ids to version ids.
- Modify: `services/api/app/schemas/testcase.py`
  Responsibility: expose source refs and revision metadata.
- Modify: `services/api/app/modules/document/service.py`
  Responsibility: make file upload create first version and trigger parse automatically.
- Modify: `services/api/app/modules/document/router.py`
  Responsibility: expose new document-center-safe routes and reparse action.
- Modify: `services/api/app/modules/generation/service.py`
  Responsibility: assemble context, persist generation output, validate richer payloads.
- Modify: `services/api/app/modules/generation/router.py`
  Responsibility: accept version-based generation requests and expose output read route.
- Modify: `services/api/app/modules/review/service.py`
  Responsibility: keep evidence visible during review lifecycle.
- Modify: `services/api/app/modules/settings/service.py`
  Responsibility: expose richer prompt-profile/runtime metadata.
- Modify: `services/api/app/modules/provider/base.py`
  Responsibility: extend provider request contract to include context bundle.
- Modify: `services/api/app/modules/provider/cursor_provider.py`
  Responsibility: build grounded prompt from context bundle, not raw ids.
- Modify: `services/api/app/modules/provider/openai_provider.py`
  Responsibility: keep contract aligned even if runtime remains disabled.
- Modify: `services/api/app/main.py`
  Responsibility: register new routes if needed.

### Backend files to create

- Create: `services/api/app/models/generation_output.py`
  Responsibility: persist raw provider response, normalized payload, and validation report.
- Create: `services/api/app/models/testcase_revision.py`
  Responsibility: persist test case revision history.
- Create: `services/api/app/modules/knowledge_context/service.py`
  Responsibility: convert selected parsed document versions into a normalized context bundle.
- Create: `services/api/app/modules/knowledge_context/__init__.py`
  Responsibility: package marker.

### Parser/worker files to modify

- Modify: `services/worker/worker_app/tasks/parse.py`
  Responsibility: enrich parse output and support `business_rule` and `supplement`.
- Modify: `services/api/app/modules/parser/prd_parser.py`
  Responsibility: produce stable PRD sections, acceptance criteria, and field-oriented metadata.
- Modify: `services/api/app/modules/parser/swagger_parser.py`
  Responsibility: keep supportive API metadata available for generation context.

### Frontend files to modify

- Modify: `apps/web/app/projects/[projectId]/documents/page.tsx`
  Responsibility: replace redirect with a real document center page.
- Modify: `apps/web/components/document-upload-panel.tsx`
  Responsibility: show versioning/parse progress instead of asset-only upload.
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
  Responsibility: select parsed document versions and show validation output.
- Modify: `apps/web/app/projects/[projectId]/review/page.tsx`
  Responsibility: display source refs/inferred markers during review.
- Modify: `apps/web/lib/api.ts`
  Responsibility: add version-based document/generation requests.
- Modify: `apps/web/lib/types.ts`
  Responsibility: reflect new version, source ref, and generation output shapes.
- Modify: `apps/web/lib/workspace-api.ts`
  Responsibility: keep workspace pages aligned with new backend payloads.

### Tests to add or modify

- Modify: `services/api/tests/test_document_upload_flow.py`
- Create: `services/api/tests/test_document_parsing_context_flow.py`
- Modify: `services/api/tests/test_generation_validation.py`
- Modify: `services/api/tests/test_generation_flow.py`
- Modify: `services/api/tests/test_testcase_review_flow.py`
- Create: `services/api/tests/test_generation_output_flow.py`
- Modify: `services/worker/tests/test_parse_task.py`
- Modify: `apps/web/src/tests/pages.test.tsx`
- Modify: `apps/web/src/tests/api.test.ts`

### Migration files to create

- Create: `services/api/alembic/versions/0017_add_generation_output_and_testcase_traceability.py`
  Responsibility: add generation output table, test case traceability fields, and revision table.

---

## Product/Test Review Corrections

Before executing any task below, apply these plan corrections as mandatory scope rules:

1. Generation input is not only document versions.
   The executable P0 unit is `selected document versions + active skill package version + generation mode`.

2. Skill package archive is a first-class P0 capability.
   Each system must be able to archive, version, activate, and reference a skill package inside TestOps.

3. Review does not end at edit/approve/publish.
   Review must also support identifying missing scenarios and launching supplement generation.

4. Supplement generation must be additive.
   Missing-scenario regeneration cannot overwrite approved cases or silently replace manually edited cases.

5. Binary PRD input must remain binary-safe.
   Any upload/versioning implementation that decodes uploaded bytes as UTF-8 during version creation is invalid for `pdf` and `docx`.

### Required execution order adjustment

Execute the work in this logical order, even if later task details still refer to the earlier numbering:

1. System skill package archive and activation
2. Auto-version upload and parse trigger
3. Structured parsing and knowledge context assembly
4. Version-based generation and generation output persistence
5. Test case traceability and revision history
6. Document center / generation / review UI closure
7. Supplement generation for missing scenarios
8. End-to-end verification and docs

### Required scope additions

The implementation must add:

- project-level skill package selection
- skill package version activation
- generation request fields for `input_skill_version_id`
- generation request field for `generation_mode`
- generation request field for reviewer prompt optimization note
- review action for scenario-gap supplement generation

---

### Task 1: Auto-Version Upload And Parse Trigger

**Files:**
- Modify: `services/api/app/schemas/document.py`
- Modify: `services/api/app/modules/document/service.py`
- Modify: `services/api/app/modules/document/router.py`
- Modify: `services/api/app/models/document.py`
- Test: `services/api/tests/test_document_upload_flow.py`

- [ ] **Step 1: Write the failing API tests**

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
    assert versions.json()[0]["version_no"] == 1
    assert versions.json()[0]["parse_status"] == "queued"
    assert dispatched == [versions.json()[0]["id"]]


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
```

- [ ] **Step 2: Run the targeted tests to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_upload_flow.py -q
```

Expected:

- upload route still returns only `DocumentAsset`
- no version exists after upload
- new document types are not handled consistently in downstream flows

- [ ] **Step 3: Implement automatic first-version creation on upload**

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
    session.add(version)
    session.commit()
    session.refresh(version)

    dispatch_issue = dispatch_parse_document_version(version.id)
    if dispatch_issue:
        version.parse_status = "failed"
        version.parse_summary = dispatch_issue
        session.add(version)
        session.commit()

    return asset
```

```python
# services/api/app/models/document.py
class DocumentAsset(Base):
    ...
    type: Mapped[str] = mapped_column(String(32))


class DocumentVersion(Base):
    ...
    parse_status: Mapped[str] = mapped_column(String(32), default="uploaded")
```

- [ ] **Step 4: Re-run the targeted tests to verify pass**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_upload_flow.py -q
```

Expected:

- PASS
- upload flow now creates one `DocumentVersion`
- parse dispatch is attempted automatically
- uploaded `pdf` / `docx` content is still parseable because bytes were not corrupted by UTF-8 decoding

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/document.py services/api/app/schemas/document.py services/api/app/modules/document/service.py services/api/app/modules/document/router.py services/api/tests/test_document_upload_flow.py
git commit -m "feat: auto-version uploaded documents"
```

---

### Task 2: Structured Parsing And Knowledge Context Assembly

**Files:**
- Modify: `services/api/app/modules/parser/prd_parser.py`
- Modify: `services/worker/worker_app/tasks/parse.py`
- Create: `services/api/app/modules/knowledge_context/service.py`
- Create: `services/api/app/modules/knowledge_context/__init__.py`
- Test: `services/api/tests/test_document_parsing_context_flow.py`
- Test: `services/worker/tests/test_parse_task.py`

- [ ] **Step 1: Write failing tests for richer parse output and context assembly**

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


def test_build_generation_context_groups_selected_versions_by_type(db_session):
    from app.modules.knowledge_context.service import build_generation_context
    ...
    context = build_generation_context(db_session, project_id=project.id, version_ids=[prd_version.id, rule_version.id])
    assert context["project_id"] == project.id
    assert context["document_versions"] == [prd_version.id, rule_version.id]
    assert len(context["prd_sections"]) == 1
    assert len(context["business_rules"]) == 1
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

- missing `knowledge_context` module
- parse payload shape too shallow for P0 requirements

- [ ] **Step 3: Implement parser enrichments and context service**

```python
# services/api/app/modules/parser/prd_parser.py
def extract_prd_sections(text: str) -> dict[str, list[dict[str, str]]]:
    sections: list[dict[str, str]] = []
    acceptance_criteria: list[dict[str, str]] = []
    field_definitions: list[dict[str, str]] = []
    ...
    return {
        "sections": sections,
        "acceptance_criteria": acceptance_criteria,
        "field_definitions": field_definitions,
        "user_actions": [],
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
        ]
    }

if normalized_type == "supplement":
    return {
        "clarifications": [
            {"text": line.strip(), "source_kind": "clarification"}
            for line in str(payload).splitlines()
            if line.strip()
        ]
    }
```

```python
# services/api/app/modules/knowledge_context/service.py
def build_generation_context(session: Session, *, project_id: int, version_ids: list[int]) -> dict[str, Any]:
    versions = ...
    return {
        "project_id": project_id,
        "document_versions": version_ids,
        "prd_sections": prd_sections,
        "business_rules": business_rules,
        "supplements": supplements,
        "swagger_hints": swagger_hints,
        "figma_hints": figma_hints,
        "ambiguities": ambiguities,
    }
```

- [ ] **Step 4: Re-run tests to verify pass**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_document_parsing_context_flow.py -q
cd D:\Menusifu\TestOps\services\worker
uv run pytest tests/test_parse_task.py -q
```

Expected:

- PASS
- parse output now contains stable P0 structures
- mixed document versions can be assembled into one generation context

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/modules/parser/prd_parser.py services/worker/worker_app/tasks/parse.py services/api/app/modules/knowledge_context/__init__.py services/api/app/modules/knowledge_context/service.py services/api/tests/test_document_parsing_context_flow.py services/worker/tests/test_parse_task.py
git commit -m "feat: add P0 parsing context assembly"
```

---

### Task 3: Version-Based Generation, Prompt Grounding, And Generation Output Persistence

**Files:**
- Create: `services/api/app/models/generation_output.py`
- Modify: `services/api/app/models/generation.py`
- Modify: `services/api/app/schemas/generation.py`
- Modify: `services/api/app/modules/generation/service.py`
- Modify: `services/api/app/modules/generation/router.py`
- Modify: `services/api/app/modules/provider/base.py`
- Modify: `services/api/app/modules/provider/cursor_provider.py`
- Modify: `services/api/app/modules/provider/openai_provider.py`
- Create: `services/api/alembic/versions/0017_add_generation_output_and_testcase_traceability.py`
- Test: `services/api/tests/test_generation_validation.py`
- Test: `services/api/tests/test_generation_flow.py`
- Test: `services/api/tests/test_generation_output_flow.py`

- [ ] **Step 1: Write failing tests for version-based generation and generation outputs**

```python
def test_create_generation_task_uses_document_version_ids(client, monkeypatch):
    from app.modules.generation import service as generation_service

    monkeypatch.setattr(generation_service, "dispatch_generation_task", lambda task_id: None)
    project = client.post("/projects", json={"name": "Gen", "code": "gen"}).json()

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={
            "provider": "cursor",
            "prompt_profile": "default",
            "input_document_version_ids": [11, 12],
        },
    )

    assert response.status_code == 201
    assert response.json()["input_refs"]["document_version_ids"] == [11, 12]


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

- schema does not accept `input_document_version_ids`
- no output persistence table exists
- provider request contract lacks context bundle

- [ ] **Step 3: Implement grounded generation flow**

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
    input_refs={"document_version_ids": payload.input_document_version_ids},
)
...
context_bundle = knowledge_context_service.build_generation_context(
    session,
    project_id=task.project_id,
    version_ids=task.input_refs["document_version_ids"],
)
response = provider.generate_test_cases(
    ProviderGenerationRequest(
        project_id=task.project_id,
        prompt_version=task.prompt_version,
        input_refs=task.input_refs,
        context_bundle=context_bundle,
    )
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
        ]
    )
```

```python
# services/api/app/models/generation_output.py
class GenerationOutput(Base):
    __tablename__ = "generation_outputs"
    id: Mapped[int] = mapped_column(primary_key=True)
    generation_task_id: Mapped[int] = mapped_column(ForeignKey("generation_tasks.id"))
    raw_response: Mapped[dict[str, Any]] = mapped_column(JSON(), nullable=False)
    normalized_payload: Mapped[dict[str, Any]] = mapped_column(JSON(), nullable=False)
    validation_report: Mapped[dict[str, Any]] = mapped_column(JSON(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
```

- [ ] **Step 4: Re-run tests to verify pass**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_generation_validation.py tests/test_generation_flow.py tests/test_generation_output_flow.py -q
```

Expected:

- PASS
- generation tasks now persist version-based input refs
- Cursor prompt receives structured context
- raw/normalized/validation output is queryable

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/generation.py services/api/app/models/generation_output.py services/api/app/schemas/generation.py services/api/app/modules/generation/service.py services/api/app/modules/generation/router.py services/api/app/modules/provider/base.py services/api/app/modules/provider/cursor_provider.py services/api/app/modules/provider/openai_provider.py services/api/alembic/versions/0017_add_generation_output_and_testcase_traceability.py services/api/tests/test_generation_validation.py services/api/tests/test_generation_flow.py services/api/tests/test_generation_output_flow.py
git commit -m "feat: ground generation on parsed document versions"
```

---

### Task 4: Test Case Traceability, Revisions, And Review Evidence

**Files:**
- Modify: `services/api/app/models/testcase.py`
- Create: `services/api/app/models/testcase_revision.py`
- Modify: `services/api/app/schemas/testcase.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/testcase/router.py`
- Modify: `services/api/app/modules/review/service.py`
- Test: `services/api/tests/test_testcase_review_flow.py`

- [ ] **Step 1: Write failing tests for source refs and revisions**

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

- test case payload does not contain `source_refs`
- no revision endpoint exists

- [ ] **Step 3: Implement traceability and revision recording**

```python
# services/api/app/models/testcase.py
class TestCase(Base):
    ...
    source_refs: Mapped[list[dict[str, Any]]] = mapped_column(JSON(), default=list, nullable=False)
    generation_task_id: Mapped[int | None] = mapped_column(ForeignKey("generation_tasks.id"), nullable=True)
    current_revision_id: Mapped[int | None] = mapped_column(nullable=True)
```

```python
# services/api/app/models/testcase_revision.py
class TestCaseRevision(Base):
    __tablename__ = "test_case_revisions"
    id: Mapped[int] = mapped_column(primary_key=True)
    test_case_id: Mapped[int] = mapped_column(ForeignKey("test_cases.id"), nullable=False)
    revision_no: Mapped[int] = mapped_column(nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    content_snapshot: Mapped[dict[str, Any]] = mapped_column(JSON(), nullable=False)
    diff_summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    editor_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
```

```python
# services/api/app/modules/testcase/service.py
def create_revision(...):
    ...

def persist_generated_cases(...):
    draft = TestCase(..., source_refs=item.get("source_refs", []), generation_task_id=generation_task_id)
    ...
    revision = create_revision(..., source_type="ai_generated")
    draft.current_revision_id = revision.id
```

- [ ] **Step 4: Re-run tests to verify pass**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_testcase_review_flow.py -q
```

Expected:

- PASS
- generated test cases expose evidence refs
- first revision is created automatically

- [ ] **Step 5: Commit**

```powershell
git add services/api/app/models/testcase.py services/api/app/models/testcase_revision.py services/api/app/schemas/testcase.py services/api/app/modules/testcase/service.py services/api/app/modules/testcase/router.py services/api/app/modules/review/service.py services/api/tests/test_testcase_review_flow.py
git commit -m "feat: add testcase traceability and revisions"
```

---

### Task 5: Document Center, Version-Aware Generation UI, And Review Evidence UI

**Files:**
- Modify: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Modify: `apps/web/components/document-upload-panel.tsx`
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/review/page.tsx`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/workspace-api.ts`
- Test: `apps/web/src/tests/pages.test.tsx`
- Test: `apps/web/src/tests/api.test.ts`

- [ ] **Step 1: Write failing page/API tests**

```tsx
it("renders document center with versions and parse summaries", async () => {
  listProjectDocumentsMock.mockResolvedValue({
    kind: "success",
    documents: [{ id: "1", projectId: "10", type: "prd", name: "Checkout PRD", sourceMode: "upload", sourceUri: "storage://10/prd.md", parseStatus: "parsed" }],
  });
  listDocumentVersionsMock.mockResolvedValue({
    kind: "success",
    versions: [{ id: "100", documentAssetId: "1", versionNo: 1, parseStatus: "parsed", parseSummary: "1 acceptance criterion", structuredMetadata: {} }],
  });
  ...
  expect(html).toContain("1 acceptance criterion");
});

it("posts generation requests using document version ids", async () => {
  ...
  await createGenerationTask("7", { input_document_version_ids: [100, 101], provider: "cursor" });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/projects/7/generation-tasks",
    expect.objectContaining({ body: JSON.stringify(expect.objectContaining({ input_document_version_ids: [100, 101] })) }),
  );
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
- API client still uses asset ids
- review page cannot show source refs

- [ ] **Step 3: Implement the frontend workflow**

```tsx
// apps/web/app/projects/[projectId]/documents/page.tsx
export default async function ProjectDocumentsPage({ params }: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  const [projectResult, documentResult] = await Promise.all([
    getProject(projectId),
    listProjectDocuments(projectId),
  ]);
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

```ts
// apps/web/lib/api.ts
export async function createGenerationTask(
  projectId: string,
  input: { input_document_version_ids: number[]; provider?: string | null; model?: string | null; prompt_profile?: string | null },
): Promise<RequestResult<GenerationTaskRecord>> {
  return postJson(`/projects/${projectId}/generation-tasks`, input);
}
```

```tsx
// apps/web/app/projects/[projectId]/review/page.tsx
{selectedCase.sourceRefs?.length ? (
  <section className="data-card">
    <h3>Source refs</h3>
    {selectedCase.sourceRefs.map((ref) => (
      <p key={`${ref.documentVersionId}-${ref.sourceKey}`}>
        {ref.documentType} · v{ref.documentVersionId} · {ref.refMode}
      </p>
    ))}
  </section>
) : null}
```

- [ ] **Step 4: Re-run tests to verify pass**

Run:

```powershell
cd D:\Menusifu\TestOps\apps\web
npm test -- src/tests/pages.test.tsx src/tests/api.test.ts
```

Expected:

- PASS
- documents page is now a real screen
- generation uses selected parsed versions
- review page exposes evidence

- [ ] **Step 5: Commit**

```powershell
git add apps/web/app/projects/[projectId]/documents/page.tsx apps/web/components/document-upload-panel.tsx apps/web/app/projects/[projectId]/generation-tasks/page.tsx apps/web/app/projects/[projectId]/review/page.tsx apps/web/lib/api.ts apps/web/lib/types.ts apps/web/lib/workspace-api.ts apps/web/src/tests/pages.test.tsx apps/web/src/tests/api.test.ts
git commit -m "feat: add version-aware main-chain UI"
```

---

### Task 6: Full Main-Chain Verification And Docs

**Files:**
- Create: `services/api/tests/test_main_chain_p0_flow.py`
- Modify: `README.md`
- Modify: `docs/local-runbook.md`

- [ ] **Step 1: Write the end-to-end P0 happy-path test**

```python
def test_p0_main_chain_flow(client, monkeypatch):
    from app.modules.document import service as document_service
    from app.modules.generation import service as generation_service

    monkeypatch.setattr(document_service, "dispatch_parse_document_version", lambda version_id: None)
    monkeypatch.setattr(generation_service, "dispatch_generation_task", lambda task_id: None)

    project = client.post("/projects", json={"name": "P0 Flow", "code": "p0-flow"}).json()
    prd = client.post(...).json()
    rule = client.post(...).json()
    supplement = client.post(...).json()
    ...
    generation = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={"provider": "mock", "input_document_version_ids": [prd_version_id, rule_version_id, supplement_version_id]},
    )
    assert generation.status_code == 201
    ...
```

- [ ] **Step 2: Run the end-to-end test to verify failure**

Run:

```powershell
cd D:\Menusifu\TestOps\services\api
uv run pytest tests/test_main_chain_p0_flow.py -q
```

Expected:

- failures reveal any remaining gaps between upload, parse, generation, review, and publish

- [ ] **Step 3: Patch the last-mile gaps and update docs**

```markdown
<!-- README.md / docs/local-runbook.md -->
1. Start postgres and redis
2. Run migrations
3. Start API
4. Start worker
5. Open document center
6. Upload PRD, business rule, and supplement files
7. Wait for parse to finish
8. Activate the target system skill package version
9. Trigger generation from parsed versions plus the active skill package
10. Review source refs
11. Trigger supplement generation if scenarios are still missing
12. Publish approved cases
```

- [ ] **Step 4: Run the complete regression set**

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

- all targeted tests PASS
- main-chain happy path is stable

- [ ] **Step 5: Commit**

```powershell
git add services/api/tests/test_main_chain_p0_flow.py README.md docs/local-runbook.md
git commit -m "test: verify P0 main-chain flow"
```

---

## Self-Review

### Spec coverage

- upload/version/parse gap: covered by Task 1
- parsing and knowledge extraction: covered by Task 2
- grounded generation and outputs: covered by Task 3
- traceability and review evidence: covered by Task 4
- document center and UI closure: covered by Task 5
- end-to-end maturity and runbook: covered by Task 6
- product/test review corrections add mandatory skill package and supplement-generation scope before implementation starts

### Placeholder scan

- no `TBD`
- no `TODO`
- no “write tests later”
- every task includes exact files, commands, and expected behavior

### Type consistency

- generation input uses `input_document_version_ids` consistently after Task 3
- source refs and revisions are introduced in Task 4 and consumed in Task 5
- document-center flow and API contract align with Task 1 and Task 5

## Additional Workstreams Required By Review

The following two workstreams are required and must be inserted into execution before final completion, even though the detailed task code blocks were not expanded in the original draft:

### Workstream A: System Skill Package Archive

Required deliverables:

- backend models for `SkillPackage` and `SkillPackageVersion`
- backend routes to create, version, list, and activate skill packages per system/project
- frontend page to inspect active skill package version
- generation request support for `input_skill_version_id`
- tests proving generation is blocked or downgraded when no active skill package exists

### Workstream B: Supplement Generation For Missing Scenarios

Required deliverables:

- generation mode support for `full` and `supplement`
- reviewer prompt optimization note persistence
- review action to trigger supplement generation
- additive persistence logic so reviewed/published cases are not overwritten
- tests proving supplement generation creates missing-scenario cases without destroying reviewed baseline

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-26-testops-p0-main-chain-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
