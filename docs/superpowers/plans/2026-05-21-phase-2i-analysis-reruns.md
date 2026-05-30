# Phase 2I: Failure Analysis Reruns

## Goal

Turn a retryable failure analysis into a queued automation rerun so the later Playwright runner, Allure report ingestion, and Codex failure-debug loop have a stable handoff point.

## Scope

- [x] Add a backend endpoint that creates an `analysis_rerun` automation run from a retryable failure analysis.
- [x] Add a frontend API helper for the rerun endpoint.
- [x] Add a project test-case page entry point to create a rerun when Codex recommends retrying.
- [x] Verify the backend flow, frontend API mapping, page rendering, and regression suite.

## Out Of Scope

- Running Playwright itself.
- Consuming queued reruns from a scheduler.
- Generating final Allure reports.
