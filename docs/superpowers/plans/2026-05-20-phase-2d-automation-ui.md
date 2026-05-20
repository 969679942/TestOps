# Phase 2D Automation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the automation generation endpoint in the web UI for published test cases.

**Architecture:** Keep automation generation as a server action from the test case library page. The page loads both reviewable cases and published cases, shows a published handoff section, and submits `POST /test-cases/{id}/automation-generations` through a web API helper.

**Tech Stack:** Next.js server pages/actions, TypeScript, Vitest.

---

## File Structure

- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/api.test.ts`
- Test: `apps/web/src/tests/pages.test.tsx`

## Task 1: Add Web API Helpers

- [x] **Step 1: Write failing API helper tests**

Add tests for `listProjectPublishedTestCases` and `createAutomationGeneration`.

- [x] **Step 2: Add types and helpers**

Add `AutomationGenerationRecord`, map API records, call `GET /projects/{projectId}/published-test-cases`, and call `POST /test-cases/{testCaseId}/automation-generations`.

- [x] **Step 3: Run API helper tests**

Run: `cd apps/web; npm test -- src/tests/api.test.ts`

## Task 2: Add Published Case Automation UI

- [x] **Step 1: Write failing page test**

Assert the test cases page renders `Published automation handoff` and `Generate automation` for published cases.

- [x] **Step 2: Add server action and published section**

Load published cases, render a compact table/list, and add a form button that invokes `createAutomationGeneration`.

- [x] **Step 3: Run frontend tests and checks**

Run: `cd apps/web; npm test`
Run: `cd apps/web; npx tsc --noEmit`
Run: `cd apps/web; npm run lint`

## Task 3: Verification and Commit

- [x] **Step 1: Run full regression**

Run: `cd services/api; .\.venv\Scripts\python.exe -m pytest -q`
Run: `cd services/worker; .\.venv\Scripts\python.exe -m pytest tests -q`
Run: `cd apps/web; npm test`

- [x] **Step 2: Commit Phase 2D automation UI**

Commit message: `feat: expose automation generation in web`

## Self-Review

- Spec coverage: Lets users trigger the first automation artifact generation from the page.
- Deferred: Download links, generation history, artifact preview, and execution remain later tasks.
- Risk: This UI intentionally has no toast/error handling yet; it relies on server revalidation and backend status for the next iteration.
