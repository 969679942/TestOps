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
