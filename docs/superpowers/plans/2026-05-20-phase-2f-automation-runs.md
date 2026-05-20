# Phase 2F Automation Runs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users create and view automation execution run records for generated Playwright assets.

**Architecture:** The API stores automation run records linked to an `AutomationGeneration`. The first slice creates queued manual runs and lists runs by project; later slices can attach a scheduler, Playwright runner, Allure artifacts, failure analysis, reruns, and Lark push without changing the UI contract.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, Next.js server actions, Vitest, pytest.

---

### Task 1: API Run Record

**Files:**
- Modify: `services/api/app/models/automation.py`
- Create: `services/api/alembic/versions/0008_add_automation_runs.py`
- Modify: `services/api/app/schemas/automation.py`
- Modify: `services/api/app/modules/automation/service.py`
- Modify: `services/api/app/modules/automation/router.py`
- Modify: `services/api/tests/test_automation_generation_flow.py`
- Modify: `services/api/tests/test_schema_metadata.py`

- [x] **Step 1: Write the failing API tests**

Add tests that generate automation assets, post to `/automation-generations/{id}/runs`, assert a queued manual run is returned, then get `/projects/{id}/automation-runs` and assert the run is listed.

- [x] **Step 2: Run test to verify it fails**

Run: `services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_automation_generation_flow.py services/api/tests/test_schema_metadata.py -q`

Expected: FAIL because the run model/table/routes do not exist.

- [x] **Step 3: Write minimal implementation**

Add the `automation_runs` table/model/schema, create a run from an existing generation, and list runs by project through the generation/test-case join.

- [x] **Step 4: Run test to verify it passes**

Run: `services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_automation_generation_flow.py services/api/tests/test_schema_metadata.py -q`

Expected: PASS.

### Task 2: Web Run Entry

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Modify: `apps/web/src/tests/api.test.ts`
- Modify: `apps/web/src/tests/pages.test.tsx`

- [x] **Step 1: Write the failing web tests**

Add API helper tests for listing and creating automation runs. Add a page test that renders a `Run automation` button and latest run status next to generated artifacts.

- [x] **Step 2: Run tests to verify they fail**

Run: `cd apps/web; npm test -- src/tests/api.test.ts src/tests/pages.test.tsx`

Expected: FAIL because helpers and UI do not exist.

- [x] **Step 3: Write minimal implementation**

Add `AutomationRunRecord`, map API responses, add `listProjectAutomationRuns` and `createAutomationRun`, and wire a server action from the test-cases page.

- [x] **Step 4: Run tests to verify they pass**

Run: `cd apps/web; npm test -- src/tests/api.test.ts src/tests/pages.test.tsx`

Expected: PASS.

### Task 3: Regression And Commit

- [x] **Step 1: Run API, worker, web, type, and lint checks**

Run:
- `services\api\.venv\Scripts\python.exe -m pytest services/api/tests -q`
- `services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests -q`
- `cd apps/web; npm test`
- `cd apps/web; npx tsc --noEmit`
- `cd apps/web; npm run lint`

- [x] **Step 2: Commit**

Commit message: `feat: add automation run records`
