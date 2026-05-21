# TestOps Full Platform Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TestOps into a multi-system automated testing platform that ingests PRD/Figma/Swagger assets, generates and reviews test cases, generates Playwright + TypeScript + POM automation, creates data through Swagger APIs, schedules execution, analyzes failures with Codex, reruns non-business failures, stores Allure/final reports, and pushes summaries to Lark.

**Architecture:** Keep the current modular monolith shape: FastAPI owns records and orchestration APIs, the worker owns long-running parsing/generation/execution jobs, and Next.js owns operator workflows. Add explicit modules for system/environment management, data setup, runner orchestration, report aggregation, scheduler, notifications, and AI diagnosis so each future phase can be implemented and verified independently.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Celery, Redis, local artifact storage, Next.js, TypeScript, Vitest, pytest, Playwright, Allure, Cursor provider, Codex/OpenAI provider contracts, Lark webhook integration.

---

## Current Baseline

- [x] Phase 1: project/document/generation/test-case/review/publish foundation.
- [x] Phase 2A: generation loop with Cursor provider scaffold and document versions.
- [x] Phase 2B: review edit, approve, and publish actions.
- [x] Phase 2C: Playwright + TypeScript + POM artifact generation scaffold.
- [x] Phase 2D: automation generation UI.
- [x] Phase 2F: automation run records.
- [x] Phase 2G: automation run result/report summary update API.
- [x] Phase 2H: failure analysis records with Codex-placeholder classification.
- [x] Phase 2I: rerun creation from retryable failure analysis.
- [x] Phase 2J: multi-system workspace environment model.
- [x] Phase 2K: Swagger-guided data setup hints, safe execution adapter, records, and UI display.

## Development Phases

### Phase 2J: Multi-System Workspace Model

**Purpose:** Let one TestOps platform manage multiple target systems without mixing environments, documents, cases, runs, and reports.

**Files:**
- Modify: `services/api/app/models/project.py`
- Create: `services/api/app/models/environment.py`
- Create: `services/api/app/schemas/environment.py`
- Create: `services/api/app/modules/environment/router.py`
- Create: `services/api/app/modules/environment/service.py`
- Modify: `services/api/app/main.py`
- Modify: `apps/web/app/projects/[projectId]/page.tsx`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/lib/types.ts`
- Test: `services/api/tests/test_environment_routes.py`
- Test: `apps/web/src/tests/api.test.ts`
- Test: `apps/web/src/tests/pages.test.tsx`

- [x] **Step 1: Write backend tests for target-system environments**

Run: `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_environment_routes.py -q`

Expected first failure: missing `/projects/{project_id}/environments` routes.

- [x] **Step 2: Add environment model and Alembic migration**

Create `Environment` with `project_id`, `name`, `code`, `base_url`, `api_base_url`, `auth_profile`, `status`, `created_at`, and `updated_at`.

- [x] **Step 3: Add environment CRUD APIs**

Expose `POST /projects/{project_id}/environments`, `GET /projects/{project_id}/environments`, and `PATCH /environments/{environment_id}`.

- [x] **Step 4: Add web environment display**

Show environments on the project overview and expose them to later data setup and runner forms.

- [x] **Step 5: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_environment_routes.py services/api/tests/test_project_routes.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/api.test.ts src/tests/pages.test.tsx
```

### Phase 2K: Swagger-Guided Data Setup

**Purpose:** Convert uploaded Swagger/OpenAPI metadata into executable data setup plans and run them before UI automation.

**Files:**
- Create: `services/api/app/models/data_setup.py`
- Create: `services/api/app/schemas/data_setup.py`
- Create: `services/api/app/modules/data_setup/service.py`
- Create: `services/api/app/modules/data_setup/router.py`
- Modify: `services/api/app/modules/parser/swagger_parser.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Test: `services/api/tests/test_data_setup_flow.py`
- Test: `services/api/tests/test_swagger_parser.py`
- Test: `apps/web/src/tests/pages.test.tsx`

- [x] **Step 1: Write tests for extracting setup candidates from Swagger**

Expected behavior: a Swagger `POST /orders` operation becomes a setup candidate with method, path, request schema, and required parameters.

- [x] **Step 2: Add data setup hint records**

Create records linked to `test_case_id`, `document_version_id`, `environment_id`, `method`, `endpoint`, `request_template`, `purpose`, `confidence_score`, and `status`.

- [x] **Step 3: Add data setup execution records**

Create execution records linked to `automation_run_id` so every run can show which API calls created prerequisite data.

- [x] **Step 4: Add safe API execution adapter**

Support only configured `api_base_url` per environment. Store request/response summaries without persisting secrets.

- [x] **Step 5: Show data setup hints in UI**

On the test-case automation handoff section, display required data setup endpoints before creating a run.

- [x] **Step 6: Verify data setup hints slice**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_data_setup_flow.py services/api/tests/test_swagger_parser.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

### Phase 2L: Playwright Runner Package

**Purpose:** Execute generated Playwright + TypeScript + POM artifacts from queued automation runs.

**Files:**
- Create: `services/runner/package.json`
- Create: `services/runner/playwright.config.ts`
- Create: `services/runner/src/run.ts`
- Create: `services/runner/src/api-client.ts`
- Create: `services/runner/src/artifacts.ts`
- Modify: `services/worker/worker_app/tasks/generate.py`
- Create: `services/worker/worker_app/tasks/run_automation.py`
- Modify: `services/api/app/modules/automation/service.py`
- Test: `services/worker/tests/test_run_automation_task.py`
- Test: `services/api/tests/test_automation_generation_flow.py`

- [ ] **Step 1: Write worker test for claiming a queued automation run**

Expected behavior: a queued run becomes `running`, then `passed` or `failed` with report metadata.

- [ ] **Step 2: Add runner API client**

The runner must call `PATCH /automation-runs/{run_id}` to write status, `report_path`, `summary`, and `error_message`.

- [ ] **Step 3: Add Playwright execution command**

Run generated specs with `npx playwright test --reporter=line,allure-playwright`.

- [ ] **Step 4: Add artifact collection**

Collect screenshots, videos, traces, and Allure result files into the run artifact directory.

- [ ] **Step 5: Wire Celery task**

Create `automation.run_queued` worker task that invokes the runner for one run.

- [ ] **Step 6: Verify**

Run:

```powershell
D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests/test_run_automation_task.py -q
cd D:\TestOps\services\runner
npm test
```

### Phase 2M: Allure Report Ingestion And Summary

**Purpose:** Store Allure output paths, parse summary metrics, and expose report links in the platform.

**Files:**
- Create: `services/api/app/models/report.py`
- Create: `services/api/app/schemas/report.py`
- Create: `services/api/app/modules/report/service.py`
- Create: `services/api/app/modules/report/router.py`
- Modify: `services/api/app/modules/automation/service.py`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Test: `services/api/tests/test_report_flow.py`
- Test: `apps/web/src/tests/api.test.ts`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write tests for report ingestion**

Expected behavior: posting report metadata creates a report record and updates the linked automation run summary.

- [ ] **Step 2: Add report records**

Store `automation_run_id`, `kind`, `artifact_root`, `index_path`, `summary`, `created_at`.

- [ ] **Step 3: Add report APIs**

Expose `POST /automation-runs/{run_id}/reports` and `GET /projects/{project_id}/automation-reports`.

- [ ] **Step 4: Show report summary in UI**

Display pass/fail counts, duration, and Allure report path near each automation run.

- [ ] **Step 5: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_report_flow.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/api.test.ts src/tests/pages.test.tsx
```

### Phase 2N: Scheduled Automation Runs

**Purpose:** Allow users to schedule selected published test cases or suites to run automatically.

**Files:**
- Create: `services/api/app/models/schedule.py`
- Create: `services/api/app/schemas/schedule.py`
- Create: `services/api/app/modules/schedule/router.py`
- Create: `services/api/app/modules/schedule/service.py`
- Create: `services/worker/worker_app/tasks/schedule.py`
- Create: `apps/web/app/projects/[projectId]/automation-schedules/page.tsx`
- Modify: `apps/web/components/app-shell.tsx`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/lib/types.ts`
- Test: `services/api/tests/test_schedule_flow.py`
- Test: `services/worker/tests/test_schedule_task.py`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write API tests for creating a schedule**

Expected behavior: `POST /projects/{project_id}/automation-schedules` stores target generation IDs, environment ID, cron expression, and active status.

- [ ] **Step 2: Add schedule model and service**

Store schedule ownership per project and environment so one platform can schedule multiple systems safely.

- [ ] **Step 3: Add scheduler worker task**

Find due schedules, create `AutomationRun` records with `trigger_mode="scheduled"`, and enqueue runner execution.

- [ ] **Step 4: Add schedule UI**

Add a schedule page with active/paused state, next run time, and latest result.

- [ ] **Step 5: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_schedule_flow.py -q
D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests/test_schedule_task.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

### Phase 2O: Real Codex Failure Analysis Provider

**Purpose:** Replace deterministic placeholder classification with a provider boundary that can call Codex/OpenAI for structured diagnosis.

**Files:**
- Create: `services/api/app/modules/analysis/provider.py`
- Create: `services/api/app/modules/analysis/prompts.py`
- Modify: `services/api/app/modules/automation/service.py`
- Modify: `services/api/app/core/config.py`
- Test: `services/api/tests/test_failure_analysis_provider.py`
- Test: `services/api/tests/test_automation_generation_flow.py`

- [ ] **Step 1: Write provider contract tests**

Expected behavior: the analysis provider returns `classification`, `confidence`, `summary`, `recommendations`, and `should_rerun`.

- [ ] **Step 2: Add prompt builder**

Prompt input must include test case summary, run summary, error message, report metadata, and recent artifact paths.

- [ ] **Step 3: Add provider selection**

Default to deterministic fallback in local tests; use configured Codex/OpenAI provider when credentials are present.

- [ ] **Step 4: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_failure_analysis_provider.py services/api/tests/test_automation_generation_flow.py -q
```

### Phase 2P: Debug Patch And Controlled Rerun Loop

**Purpose:** For failures classified as automation issues, generate a proposed fix, store it for human review, and rerun after approval.

**Files:**
- Create: `services/api/app/models/debug_patch.py`
- Create: `services/api/app/schemas/debug_patch.py`
- Create: `services/api/app/modules/debug_patch/router.py`
- Create: `services/api/app/modules/debug_patch/service.py`
- Modify: `services/api/app/modules/automation/service.py`
- Create: `apps/web/app/projects/[projectId]/failure-analysis/page.tsx`
- Test: `services/api/tests/test_debug_patch_flow.py`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write tests for creating a debug patch proposal**

Expected behavior: a retryable analysis can create a patch proposal linked to generated automation artifact paths.

- [ ] **Step 2: Add debug patch records**

Store `analysis_id`, `status`, `provider`, `model`, `patch_summary`, `changed_files`, `diff_text`, `reviewer_id`, and timestamps.

- [ ] **Step 3: Add approval workflow**

Only approved debug patches can trigger an `analysis_rerun` run.

- [ ] **Step 4: Add failure analysis workspace**

Show diagnosis, recommendations, proposed patch, approval buttons, and rerun history.

- [ ] **Step 5: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_debug_patch_flow.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

### Phase 2Q: Final Report Aggregation

**Purpose:** Combine data setup, Playwright execution, Allure, failure diagnosis, reruns, and business status into one final platform report.

**Files:**
- Create: `services/api/app/models/final_report.py`
- Create: `services/api/app/schemas/final_report.py`
- Create: `services/api/app/modules/final_report/router.py`
- Create: `services/api/app/modules/final_report/service.py`
- Create: `apps/web/app/projects/[projectId]/reports/page.tsx`
- Modify: `apps/web/components/app-shell.tsx`
- Test: `services/api/tests/test_final_report_flow.py`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write aggregation tests**

Expected behavior: a final report includes original run, rerun chain, latest status, report URLs, failure classification, and data setup summary.

- [ ] **Step 2: Add final report generation service**

Create immutable report snapshots so later reruns do not mutate already-sent reports.

- [ ] **Step 3: Add report dashboard**

Show report cards per project and filters for environment, schedule, status, and date.

- [ ] **Step 4: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_final_report_flow.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

### Phase 2R: Lark Notification Push

**Purpose:** Push final report summaries and failure alerts to Lark while keeping full details visible in the platform.

**Files:**
- Create: `services/api/app/models/notification.py`
- Create: `services/api/app/schemas/notification.py`
- Create: `services/api/app/modules/notification/lark.py`
- Create: `services/api/app/modules/notification/router.py`
- Create: `services/api/app/modules/notification/service.py`
- Modify: `services/api/app/core/config.py`
- Modify: `services/api/app/modules/final_report/service.py`
- Test: `services/api/tests/test_lark_notification.py`

- [ ] **Step 1: Write tests for Lark payload rendering**

Expected behavior: a final report is converted into a Lark card payload containing project, environment, pass/fail summary, report link, and failure diagnosis summary.

- [ ] **Step 2: Add notification configuration**

Store project-level Lark webhook URL, enabled state, and event subscriptions.

- [ ] **Step 3: Add Lark adapter**

Send webhook payloads with timeout handling and store notification delivery status.

- [ ] **Step 4: Trigger push from final report generation**

When report status is finalized, create notification events for enabled project subscriptions.

- [ ] **Step 5: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_lark_notification.py -q
```

### Phase 2S: Admin Settings And Provider Controls

**Purpose:** Let admins configure Cursor, Codex/OpenAI, environments, prompt profiles, and notification defaults from the platform.

**Files:**
- Modify: `apps/web/app/settings/page.tsx`
- Create: `services/api/app/models/settings.py`
- Create: `services/api/app/schemas/settings.py`
- Create: `services/api/app/modules/settings/router.py`
- Create: `services/api/app/modules/settings/service.py`
- Test: `services/api/tests/test_settings_flow.py`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write settings API tests**

Expected behavior: project defaults can set provider, prompt profile, runner timeout, and notification preferences.

- [ ] **Step 2: Add settings model**

Keep secrets out of API responses. Store secret references or environment variable names, not raw provider keys.

- [ ] **Step 3: Add settings UI**

Render provider defaults, prompt profile, runner defaults, and Lark status.

- [ ] **Step 4: Verify**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests/test_settings_flow.py -q
cd D:\TestOps\apps\web
npm test -- src/tests/pages.test.tsx
```

### Phase 2T: Full End-To-End Verification

**Purpose:** Prove the full product path works from source documents to final report and Lark notification.

**Files:**
- Create: `services/api/tests/test_full_platform_flow.py`
- Create: `docs/runbooks/full-platform-local.md`
- Modify: `README.md`

- [ ] **Step 1: Write full platform integration test**

Scenario: create project and environment, upload PRD/Figma/Swagger, parse Swagger, generate test cases, approve/publish, generate automation, create data setup, create run, ingest report, analyze failure, create rerun, finalize report, enqueue Lark notification.

- [ ] **Step 2: Add local runbook**

Document how to start API, worker, web, runner, and local test services.

- [ ] **Step 3: Run complete verification**

Run:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests -q
D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests -q
cd D:\TestOps\apps\web
npm test
npx tsc --noEmit
npm run lint
```

## Product Coverage Matrix

- [x] Upload PRD/Figma/Swagger inputs: covered by Phase 1 and Phase 2A.
- [x] Generate test case drafts through Cursor provider scaffold: covered by Phase 2A.
- [x] Human review, edit, approve, publish: covered by Phase 2B.
- [x] Generate Playwright + TypeScript + POM artifacts: covered by Phase 2C and Phase 2D.
- [x] Record automation runs and result summaries: covered by Phase 2F and Phase 2G.
- [x] Analyze failures and create rerun records: covered by Phase 2H and Phase 2I.
- [x] One platform testing multiple systems: Phase 2J.
- [x] Swagger-guided API data creation: Phase 2K.
- [ ] Real Playwright runner execution: Phase 2L.
- [ ] Allure report ingestion and display: Phase 2M.
- [ ] Scheduled automation execution: Phase 2N.
- [ ] Real Codex failure diagnosis: Phase 2O.
- [ ] Debug patch proposal and controlled self-healing loop: Phase 2P.
- [ ] Final report aggregation: Phase 2Q.
- [ ] Lark report push: Phase 2R.
- [ ] Admin settings and provider controls: Phase 2S.
- [ ] Full end-to-end verification/runbook: Phase 2T.

## Verification Policy

Every phase must follow TDD:

- [ ] Add or update tests first.
- [ ] Run targeted tests and confirm the new tests fail for the expected missing behavior.
- [ ] Implement the smallest passing slice.
- [ ] Run targeted tests and full regression.
- [ ] Commit after a clean verification pass.
- [ ] Push when GitHub connectivity is available.

Full regression command set:

```powershell
D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests -q
D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests -q
cd D:\TestOps\apps\web
npm test
npx tsc --noEmit
npm run lint
```

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-testops-full-platform-roadmap.md`.

Recommended execution order:

1. Phase 2J: multi-system workspace model.
2. Phase 2K: Swagger-guided data setup.
3. Phase 2L: Playwright runner.
4. Phase 2M: Allure report ingestion.
5. Phase 2N: scheduler.
6. Phase 2O: real Codex failure analysis provider.
7. Phase 2P: debug patch and controlled rerun loop.
8. Phase 2Q: final report aggregation.
9. Phase 2R: Lark push.
10. Phase 2S: admin settings.
11. Phase 2T: full end-to-end verification.
