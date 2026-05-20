# Phase 2C Automation Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first backend slice that turns a published test case into stored Playwright + TypeScript + POM automation assets.

**Architecture:** The API owns automation generation records and stores generated files as local artifacts. A small deterministic generator converts structured test case steps into a spec file plus a page-object file so the platform has a concrete artifact shape before AI-assisted code generation is introduced. Later phases can replace the deterministic generator with Cursor/Codex generation and add execution, Allure, schedules, failure analysis, and Lark push.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, local artifact storage, pytest.

---

## File Structure

- Create: `services/api/app/models/automation.py`
- Modify: `services/api/app/models/__init__.py`
- Create: `services/api/alembic/versions/0007_add_automation_generations.py`
- Create: `services/api/app/schemas/automation.py`
- Create: `services/api/app/modules/automation/generator.py`
- Create: `services/api/app/modules/automation/service.py`
- Create: `services/api/app/modules/automation/router.py`
- Modify: `services/api/app/main.py`
- Test: `services/api/tests/test_automation_generation_flow.py`
- Modify: `services/api/tests/test_schema_metadata.py`

## Task 1: Add Automation Generation Records

- [x] **Step 1: Write failing API tests for automation generation**

Create a published test case, call `POST /test-cases/{id}/automation-generations`, assert a generation record is returned with status `completed`, framework `playwright`, language `typescript`, pattern `pom`, and artifact paths containing a spec and page-object file. Assert the generated files exist and include the test case title.

- [x] **Step 2: Verify the new test fails**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest tests/test_automation_generation_flow.py -q`
Expected: FAIL because the automation module and route do not exist.

- [x] **Step 3: Add ORM model and migration**

Add `AutomationGeneration` with `test_case_id`, `status`, `framework`, `language`, `pattern`, `artifact_root`, `artifact_paths`, `error_message`, `created_at`, and `completed_at`.

- [x] **Step 4: Add schemas**

Add request schema with default `framework="playwright"`, `language="typescript"`, `pattern="pom"` and read schema for generation records.

## Task 2: Generate Playwright/POM Artifacts

- [x] **Step 1: Add deterministic generator**

Generate two files for the test case:
- `tests/<slug>.spec.ts`
- `pages/<slug>.page.ts`

The spec imports the page object, declares `test('<title>', ...)`, and includes comments for preconditions, steps, expected results, and automation notes.

- [x] **Step 2: Add service and router**

Only published cases can generate automation. Non-published cases return `409`. The service writes artifacts under `settings.artifact_storage_root/automation/test-cases/<id>/generation-<generation_id>/`.

- [x] **Step 3: Run automation API tests**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest tests/test_automation_generation_flow.py -q`

## Task 3: Verification and Commit

- [x] **Step 1: Run API regression**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest -q`

- [x] **Step 2: Run worker and web smoke regression**

Run: `cd services/worker; .\.venv\Scripts\python.exe -m pytest tests -q`
Run: `cd apps/web; npm test`

- [x] **Step 3: Commit Phase 2C automation generation**

Commit message: `feat: add automation generation artifacts`

## Self-Review

- Spec coverage: Starts the Playwright + TypeScript + POM handoff after cases are published.
- Deferred: AI-generated automation code, Swagger-driven data setup, execution scheduling, Allure, failure analysis, reruns, final reports, and Lark push remain later phases.
- Risk: The first generator intentionally emits scaffold-quality Playwright code with comments, not runnable business-flow automation.
