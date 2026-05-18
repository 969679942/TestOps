# TestOps

## Services

- `apps/web`: Next.js management console
- `services/api`: FastAPI application
- `services/worker`: Celery worker

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
