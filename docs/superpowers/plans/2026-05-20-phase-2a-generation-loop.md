# Phase 2A Generation Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the phase-one scaffold into a usable generation loop where uploaded/linked inputs can be parsed, Cursor-backed generation can run, and generated cases are persisted as reviewable drafts.

**Architecture:** Keep the modular monolith shape. The API owns database records and upload metadata, the worker owns parsing/provider execution, and provider adapters expose one normalized response shape. Cursor integration uses a configurable `cursor-agent` command path so local development can use the user's Cursor account without storing credentials in the app.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Celery, Redis, local artifact storage, Cursor Agent CLI, Next.js server pages, Vitest, pytest.

---

## File Structure

- Modify: `services/api/app/models/document.py`
- Modify: `services/api/app/models/generation.py`
- Modify: `services/api/app/models/testcase.py`
- Modify: `services/api/app/core/config.py`
- Modify: `services/api/app/modules/document/service.py`
- Modify: `services/api/app/modules/document/router.py`
- Modify: `services/api/app/modules/generation/service.py`
- Modify: `services/api/app/modules/provider/cursor_provider.py`
- Modify: `services/worker/worker_app/tasks/generate.py`
- Modify: `services/worker/worker_app/tasks/parse.py`
- Create: `services/api/alembic/versions/0006_add_document_versions_and_generation_outputs.py`
- Test: `services/api/tests/test_document_upload_flow.py`
- Test: `services/api/tests/test_cursor_provider.py`
- Test: `services/worker/tests/test_generate_task.py`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Test: `apps/web/src/tests/pages.test.tsx`

## Task 1: Persist Generated Draft Cases

**Files:**
- Modify: `services/worker/worker_app/tasks/generate.py`
- Modify: `services/api/app/modules/generation/service.py`
- Test: `services/worker/tests/test_generate_task.py`

- [x] **Step 1: Write a failing worker test proving generated cases become drafts**

Add a provider fake that returns one structured case, invoke `generate_test_cases`, then assert `test_cases` contains the draft.

- [x] **Step 2: Run the worker test and verify it fails**

Run: `cd services/worker; uv run pytest tests/test_generate_task.py -q`
Expected: FAIL because the worker currently normalizes cases but does not persist them.

- [x] **Step 3: Add a `persist_generated_cases` service helper**

The helper should accept `session`, `project_id`, and normalized cases, then create `TestCase` rows with conservative defaults for fields the model does not yet provide.

- [x] **Step 4: Call the helper from the worker**

After normalization succeeds, persist drafts before marking the task `completed`.

- [x] **Step 5: Run worker and API tests**

Run: `cd services/worker; uv run pytest tests -q`
Run: `cd services/api; uv run pytest tests/test_generation_validation.py tests/test_testcase_review_flow.py -q`

## Task 2: Add Cursor CLI Provider Adapter

**Files:**
- Modify: `services/api/app/core/config.py`
- Modify: `services/api/app/modules/provider/cursor_provider.py`
- Test: `services/api/tests/test_cursor_provider.py`

- [x] **Step 1: Write failing provider tests**

Cover command construction, JSON parsing, timeout/error handling, and the missing CLI case.

- [x] **Step 2: Implement provider settings**

Add `cursor_agent_command`, `cursor_agent_timeout_seconds`, and `cursor_agent_cwd` settings with safe defaults.

- [x] **Step 3: Implement Cursor invocation**

Run `cursor-agent --print --output-format json` with a generated prompt. Parse the final JSON response and extract the generated cases from the provider text.

- [x] **Step 4: Run provider tests**

Run: `cd services/api; uv run pytest tests/test_cursor_provider.py -q`

## Task 3: Add Document Versions and Upload Metadata

**Files:**
- Modify: `services/api/app/models/document.py`
- Modify: `services/api/app/schemas/document.py`
- Modify: `services/api/app/modules/document/service.py`
- Modify: `services/api/app/modules/document/router.py`
- Create: `services/api/alembic/versions/0006_add_document_versions_and_generation_outputs.py`
- Test: `services/api/tests/test_document_upload_flow.py`

- [ ] **Step 1: Write failing tests for file upload and URL version creation**

Verify a document version is created with storage path/checksum and initial parse status.

- [ ] **Step 2: Add ORM and migration**

Add `DocumentVersion` with `document_asset_id`, `version_no`, `storage_path`, `checksum`, `parse_status`, `parse_summary`, and `structured_metadata`.

- [ ] **Step 3: Add service/router endpoints**

Add `POST /documents/{document_id}/versions` for upload or URL metadata and `POST /document-versions/{version_id}/parse`.

- [ ] **Step 4: Run document API tests**

Run: `cd services/api; uv run pytest tests/test_document_routes.py tests/test_document_upload_flow.py -q`

## Task 4: Wire Parse Task to Stored Document Versions

**Files:**
- Modify: `services/worker/worker_app/tasks/parse.py`
- Modify: `services/api/app/modules/document/service.py`
- Test: `services/worker/tests/test_parse_task.py`

- [ ] **Step 1: Write failing parse task test using database-backed document version**

Create a version with stored Swagger JSON, run parse, and assert `parse_status` and metadata are updated.

- [ ] **Step 2: Implement artifact loading and DB update**

When `document_version_id` is passed without explicit payload, load the version, read the stored artifact, parse by document type, save structured metadata, and mark status.

- [ ] **Step 3: Run worker parse tests**

Run: `cd services/worker; uv run pytest tests/test_parse_task.py -q`

## Task 5: Expose Real Frontend Actions

**Files:**
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write failing page tests for upload/create-generation forms**

Assert the document page renders upload/link controls and the generation page renders a create task action.

- [ ] **Step 2: Add API helpers**

Add helpers for creating document assets, creating versions, triggering parse, and creating generation tasks.

- [ ] **Step 3: Add server actions/forms**

Use simple server forms first; keep the UI intentionally small and traceable.

- [ ] **Step 4: Run frontend tests**

Run: `cd apps/web; npm test`
Run: `cd apps/web; npx tsc --noEmit`
Run: `cd apps/web; npm run lint`

## Self-Review

- Spec coverage: Covers document upload/versioning, parsing, Cursor provider, generation task execution, draft persistence, and first frontend actions.
- Deferred: Playwright generation, scheduled execution, Allure reports, failure self-healing, and Lark push remain later phases.
- Risk: Cursor Agent CLI is not currently installed in this Windows PowerShell environment. The adapter must fail clearly until the user installs `cursor-agent` or configures its path.
