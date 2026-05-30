# TestOps

## Services

- `apps/web`: Next.js management console
- `services/api`: FastAPI application
- `services/worker`: Celery worker

## Prerequisites

- Node.js `20.9.0` or newer. Next.js 16 and Vitest 3 do not support the current local `node v19.2.0`.
- Docker Desktop or another local Docker runtime that provides `docker compose`.
- `uv` for Python dependency management on Windows. Official install options include:
  - `winget install --id=astral-sh.uv -e`
  - `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

## Local development

1. Start dependencies:
   `docker compose up -d postgres redis`
2. Install frontend deps:
   `cd apps/web && npm install`
3. Install backend deps:
   `cd services/api && uv sync`
4. Install worker deps:
   `cd services/worker && uv sync`
5. Run services in separate terminals.

## Verification

1. Start local dependencies:
   `docker compose up -d postgres redis`
2. Apply API migrations:
   `cd services/api && uv run alembic upgrade head`
3. Seed demo data:
   `cd services/api && uv run python -m scripts.seed_demo_data`
4. Start the API:
   `cd services/api && uv run uvicorn app.main:app --reload`
5. Start the worker:
   `cd services/worker && uv run celery -A worker_app.celery_app worker -l info`
6. Start the web app:
   `cd apps/web && npm run dev`

## Test Commands

- API integration smoke:
  `cd services/api && uv run pytest tests/test_end_to_end_flow.py -v`
- API full suite:
  `cd services/api && uv run pytest -v`
- Worker suite:
  `cd services/worker && uv run pytest tests -q`
- Web suite:
  `cd apps/web && npm test`
- Web type check:
  `cd apps/web && npx tsc --noEmit`
- Web lint:
  `cd apps/web && npm run lint`
