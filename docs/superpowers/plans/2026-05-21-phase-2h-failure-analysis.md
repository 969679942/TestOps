# Phase 2H Failure Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a failure-analysis entry point for failed automation runs so the platform can classify failures and recommend whether a rerun/debug path is appropriate.

**Architecture:** Store failure analyses as records linked to `automation_runs`. The first implementation uses a deterministic Codex-placeholder analyzer that classifies common locator/time-out errors as automation issues, reserving the API shape for a future real Codex model call.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, Next.js server actions, Vitest, pytest.

---

### Task 1: Backend Failure Analysis

**Files:**
- Modify: `services/api/app/models/automation.py`
- Modify: `services/api/app/models/__init__.py`
- Create: `services/api/alembic/versions/0009_add_automation_failure_analyses.py`
- Modify: `services/api/app/schemas/automation.py`
- Modify: `services/api/app/modules/automation/service.py`
- Modify: `services/api/app/modules/automation/router.py`
- Modify: `services/api/tests/test_automation_generation_flow.py`
- Modify: `services/api/tests/test_schema_metadata.py`

- [x] **Step 1: Write failing API tests**

Add tests for `POST /automation-runs/{id}/failure-analyses` and `GET /projects/{id}/automation-failure-analyses`.

- [x] **Step 2: Verify red**

Run: `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_automation_generation_flow.py services/api/tests/test_schema_metadata.py -q`

Expected: FAIL because the analysis table and routes do not exist.

- [x] **Step 3: Implement minimal backend**

Add model, migration, schema, service, and routes. Only failed runs can be analyzed.

- [x] **Step 4: Verify green**

Run: `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_automation_generation_flow.py services/api/tests/test_schema_metadata.py -q`

Expected: PASS.

### Task 2: Web Failure Analysis Entry

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Modify: `apps/web/src/tests/api.test.ts`
- Modify: `apps/web/src/tests/pages.test.tsx`

- [x] **Step 1: Write failing web tests**

Add API helper tests and page tests showing an `Analyze failure` action plus latest analysis summary.

- [x] **Step 2: Verify red**

Run: `cd D:\TestOps\apps\web; npm test -- src/tests/api.test.ts src/tests/pages.test.tsx`

Expected: FAIL because helpers and UI do not exist.

- [x] **Step 3: Implement minimal web changes**

Add list/create analysis helpers and render analysis metadata next to failed runs.

- [x] **Step 4: Verify green**

Run: `cd D:\TestOps\apps\web; npm test -- src/tests/api.test.ts src/tests/pages.test.tsx`

Expected: PASS.

### Task 3: Regression And Push

- [x] **Step 1: Run regression checks**

Run:
- `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests -q`
- `D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests -q`
- `cd D:\TestOps\apps\web; npm test`
- `cd D:\TestOps\apps\web; npx tsc --noEmit`
- `cd D:\TestOps\apps\web; npm run lint`

- [x] **Step 2: Commit and push**

Commit message: `feat: add automation failure analysis`
