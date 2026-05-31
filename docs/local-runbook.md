# TestOps Local Runbook

## Prerequisites

- Node.js from the Codex bundled runtime or another Node version that supports `node --import tsx`.
- Python virtual environments under `services/api/.venv` and `services/worker/.venv`.
- Optional Redis/Postgres for full Celery execution; SQLite test fixtures cover local verification.

## Start Local Services

1. Install web dependencies from `apps/web` with `npm install` if needed.
2. Start the web app from `apps/web` with `npm run dev`.
3. Start the API from `services/api` using the project virtual environment and the configured FastAPI command.
4. Start worker processes when exercising asynchronous generation, scheduled runs, or runner dispatch.

## Runtime Configuration

- `TESTOPS_API_BASE_URL` points the web app to the API. Default: `http://127.0.0.1:8000`.
- `CURSOR_AGENT_COMMAND`, `CURSOR_AGENT_TIMEOUT_SECONDS`, and `CURSOR_AGENT_CWD` configure Cursor/Codex generation boundaries.
- `CODEX_FAILURE_ANALYSIS_MODEL` selects the failure-analysis provider model label.
- `LARK_WEBHOOK_URL` enables final-report push to Lark. When unset, Lark push is safely skipped.

## Phase 2 Acceptance Flow

1. Create a project and environment.
2. Upload PRD/Figma/Swagger evidence and generate reviewed test cases.
3. Publish a test case and generate Playwright + TypeScript + POM automation.
4. Create an automation schedule with case, environment, and cron.
5. Run automation and ingest Allure report summary.
6. Analyze failures through the provider boundary.
7. Create a debug proposal, approve it manually, then trigger controlled rerun.
8. Generate the final report and push it to Lark when configured.

## Project Lifecycle

- Active projects appear in the default project list.
- Archived projects move to the archived view and remain readable.
- Archived projects reject document, generation, test case, and schedule write operations until restored.

## Verification Commands

- API: `D:\TestOps\services\api\.venv\Scripts\python.exe -m pytest services/api/tests -q`
- Worker: `D:\TestOps\services\worker\.venv\Scripts\python.exe -m pytest services/worker/tests -q`
- Web tests: run `npm test` from `apps/web`.
- Web typecheck: run `npx tsc --noEmit` from `apps/web`.
- Web lint: run `npm run lint` from `apps/web`.
- Runner tests: run `npm test` from `services/runner` with the Codex bundled Node path first on `PATH`.
