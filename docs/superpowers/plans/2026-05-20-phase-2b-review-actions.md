# Phase 2B Review Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generated test case drafts editable from the review workspace and allow reviewers to approve and publish cases.

**Architecture:** Keep the API as the source of truth for test case state. Add a focused update endpoint for editable fields, reuse the existing review endpoint for approval/change requests, and reuse the existing publish endpoint. The web review page will submit server actions that call these endpoints and revalidate the project review routes.

**Tech Stack:** FastAPI, Pydantic v2, SQLAlchemy 2, Next.js server actions, TypeScript, Vitest, pytest.

---

## File Structure

- Modify: `services/api/app/schemas/testcase.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/testcase/router.py`
- Test: `services/api/tests/test_testcase_review_flow.py`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/components/review-editor.tsx`
- Modify: `apps/web/app/projects/[projectId]/review/page.tsx`
- Test: `apps/web/src/tests/api.test.ts`
- Test: `apps/web/src/tests/pages.test.tsx`

## Task 1: Add Test Case Update API

- [x] **Step 1: Write failing API test for updating editable test case fields**

Add a test that creates a draft case, sends `PATCH /test-cases/{id}` with updated title, steps, expected results, tags, automation flag, and notes, then asserts the response and persisted row reflect the changes.

- [x] **Step 2: Run API review tests and verify the new test fails**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest tests/test_testcase_review_flow.py -q`
Expected: FAIL with 404 or method not allowed for `PATCH /test-cases/{id}`.

- [x] **Step 3: Add `TestCaseUpdate` schema and update service helper**

Add a schema with the same editable fields as `TestCaseCreate`, except status is not directly editable. Add `update_test_case(session, test_case_id, payload)` that loads the case, rejects published cases with `409`, updates fields, commits, refreshes, and returns `TestCase`.

- [x] **Step 4: Add router endpoint**

Add `PATCH /test-cases/{test_case_id}` returning `TestCaseRead`.

- [x] **Step 5: Run API tests**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest tests/test_testcase_review_flow.py -q`

## Task 2: Add Web Review Save/Approve/Publish Actions

- [x] **Step 1: Write failing frontend tests for review actions**

Assert the review page renders a real form with `Save draft`, `Approve`, and `Publish` actions when a case is selected.

- [x] **Step 2: Add web API helpers**

Add helpers for `updateTestCase`, `addTestCaseReview`, and `publishTestCase`, mapping API payloads into existing `TestCaseRecord`.

- [x] **Step 3: Wire review page server actions**

Wrap `ReviewEditor` in forms that submit to server actions. The save action parses form fields into API payload shape; approve calls the review endpoint with action `approve`; publish calls the publish endpoint.

- [x] **Step 4: Run frontend tests and type checks**

Run: `cd apps/web; npm test`
Run: `cd apps/web; npx tsc --noEmit`
Run: `cd apps/web; npm run lint`

## Task 3: Verification and Commit

- [x] **Step 1: Run backend and worker regression**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest -q`
Run: `cd services/worker; .\.venv\Scripts\python.exe -m pytest tests -q`

- [x] **Step 2: Run frontend verification**

Run: `cd apps/web; npm test`
Run: `cd apps/web; npx tsc --noEmit`
Run: `cd apps/web; npm run lint`

- [x] **Step 3: Commit Phase 2B review actions**

Commit message: `feat: add review workspace actions`

## Self-Review

- Spec coverage: Covers the missing human review loop between generated drafts and published test cases.
- Deferred: Rich review history UI, field-level diffing, reviewer identity management, and published-case automation generation remain later tasks.
- Risk: The first implementation uses simple server actions and form fields; it favors traceable workflow completion over a polished interactive editor.
