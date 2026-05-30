# Phase 2G Automation Run Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the platform record automation run execution results, report paths, summaries, and failure messages.

**Architecture:** Reuse the existing `automation_runs` table. Add a backend update endpoint that a future Playwright runner can call, then surface report metadata in the web API helpers and test-case automation handoff UI.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js server-side API helpers, Vitest, pytest.

---

### Task 1: Backend Run Result Update

**Files:**
- Modify: `services/api/app/schemas/automation.py`
- Modify: `services/api/app/modules/automation/service.py`
- Modify: `services/api/app/modules/automation/router.py`
- Modify: `services/api/tests/test_automation_generation_flow.py`

- [x] **Step 1: Write the failing API test**

Add a test that creates an automation run, calls `PATCH /automation-runs/{id}` with `status`, `report_path`, `summary`, and `error_message`, then asserts the returned run and project run history include the updated result.

- [x] **Step 2: Run the API test to verify it fails**

Run: `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_automation_generation_flow.py -q`

Expected: FAIL because `PATCH /automation-runs/{id}` does not exist.

- [x] **Step 3: Implement the minimal backend update path**

Add `AutomationRunUpdate`, `_get_run`, `update_run`, and a PATCH route. When status is `running`, set `started_at`; when status is `passed` or `failed`, set `finished_at`.

- [x] **Step 4: Run the API test to verify it passes**

Run: `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_automation_generation_flow.py -q`

Expected: PASS.

### Task 2: Web API And Report Metadata

**Files:**
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Modify: `apps/web/src/tests/api.test.ts`
- Modify: `apps/web/src/tests/pages.test.tsx`

- [x] **Step 1: Write failing web tests**

Add an API helper test for updating automation run results and a page test asserting latest run report metadata is rendered.

- [x] **Step 2: Run web tests to verify they fail**

Run: `cd D:\TestOps\apps\web; npm test -- src/tests/api.test.ts src/tests/pages.test.tsx`

Expected: FAIL because the helper and page rendering are missing.

- [x] **Step 3: Implement the minimal web changes**

Add `updateAutomationRun` and render latest run `reportPath`, `summary.passed`, and `summary.failed` when available.

- [x] **Step 4: Run web tests to verify they pass**

Run: `cd D:\TestOps\apps\web; npm test -- src/tests/api.test.ts src/tests/pages.test.tsx`

Expected: PASS.

### Task 3: Regression And Commit

- [x] **Step 1: Run regression checks**

Run:
- `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests -q`
- `D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests -q`
- `cd D:\TestOps\apps\web; npm test`
- `cd D:\TestOps\apps\web; npx tsc --noEmit`
- `cd D:\TestOps\apps\web; npm run lint`

- [ ] **Step 2: Commit and push**

Commit message: `feat: record automation run results`
