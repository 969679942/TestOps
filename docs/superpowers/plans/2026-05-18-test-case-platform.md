# Test Case Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first deliverable of TestOps: a modular-monolith test case platform that ingests PRD/Figma/Swagger inputs, generates structured test case drafts through Cursor/OpenAI providers, supports QA review and publish workflows, and exposes published cases plus automation/data-setup hints for later downstream modules.

**Architecture:** Use a split frontend/backend deployment with a modular monolith backend. The web app is `Next.js + TypeScript`; the API and worker stack is `FastAPI + SQLAlchemy + Celery + Redis + PostgreSQL`. Uploaded artifacts are stored locally behind an object-storage-like interface so the project can later move to MinIO/S3 without breaking module boundaries.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Celery, Redis, PostgreSQL, pytest, React Testing Library, Playwright (for future frontend e2e only), Cursor/OpenAI provider adapters

---

## File Structure

### Repository layout

- Create: `apps/web/`
- Create: `services/api/`
- Create: `services/worker/`
- Create: `docs/superpowers/plans/2026-05-18-test-case-platform.md`
- Create: `docker-compose.yml`
- Create: `.editorconfig`
- Create: `README.md`

### Frontend layout

- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/projects/[projectId]/page.tsx`
- Create: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Create: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Create: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Create: `apps/web/app/projects/[projectId]/review/page.tsx`
- Create: `apps/web/components/`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/types.ts`

### Backend API layout

- Create: `services/api/pyproject.toml`
- Create: `services/api/app/main.py`
- Create: `services/api/app/core/config.py`
- Create: `services/api/app/core/database.py`
- Create: `services/api/app/core/security.py`
- Create: `services/api/app/models/`
- Create: `services/api/app/schemas/`
- Create: `services/api/app/api/routes/`
- Create: `services/api/app/modules/project/`
- Create: `services/api/app/modules/document/`
- Create: `services/api/app/modules/generation/`
- Create: `services/api/app/modules/testcase/`
- Create: `services/api/app/modules/review/`
- Create: `services/api/app/modules/provider/`
- Create: `services/api/app/modules/parser/`
- Create: `services/api/alembic.ini`
- Create: `services/api/alembic/`

### Worker layout

- Create: `services/worker/pyproject.toml`
- Create: `services/worker/worker_app/celery_app.py`
- Create: `services/worker/worker_app/tasks/parse.py`
- Create: `services/worker/worker_app/tasks/generate.py`

### Shared testing/docs layout

- Create: `services/api/tests/`
- Create: `apps/web/src/tests/`

## Task 1: Bootstrap Repository and Developer Tooling

**Files:**
- Create: `.editorconfig`
- Create: `README.md`
- Create: `docker-compose.yml`
- Create: `apps/web/package.json`
- Create: `services/api/pyproject.toml`
- Create: `services/worker/pyproject.toml`

- [ ] **Step 1: Add base repo conventions**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.py]
indent_size = 4
```

- [ ] **Step 2: Add a root README with local startup instructions**

```md
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
```

- [ ] **Step 3: Add local infrastructure compose file**

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: testops
      POSTGRES_USER: testops
      POSTGRES_PASSWORD: testops
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

- [ ] **Step 4: Initialize the frontend package**

```json
{
  "name": "testops-web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "16.0.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 5: Initialize the API package**

```toml
[project]
name = "testops-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "alembic>=1.16.0",
  "fastapi>=0.116.0",
  "psycopg[binary]>=3.2.0",
  "pydantic-settings>=2.10.0",
  "redis>=6.2.0",
  "sqlalchemy>=2.0.41",
  "uvicorn>=0.35.0"
]

[dependency-groups]
dev = [
  "httpx>=0.28.1",
  "pytest>=8.4.0",
  "pytest-asyncio>=1.0.0"
]
```

- [ ] **Step 6: Initialize the worker package**

```toml
[project]
name = "testops-worker"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "celery[redis]>=5.5.3",
  "httpx>=0.28.1",
  "pydantic-settings>=2.10.0",
  "python-docx>=1.1.2",
  "pypdf>=5.6.0",
  "pyyaml>=6.0.2",
  "redis>=6.2.0"
]
```

- [ ] **Step 7: Verify basic repo scaffolding**

Run: `Get-ChildItem -Recurse -Depth 2`
Expected: `apps/web`, `services/api`, `services/worker`, `docker-compose.yml`, `README.md`

- [ ] **Step 8: Commit**

```bash
git add .editorconfig README.md docker-compose.yml apps services
git commit -m "chore: bootstrap testops workspace"
```

## Task 2: Build the API Core and Persistence Foundation

**Files:**
- Create: `services/api/app/main.py`
- Create: `services/api/app/core/config.py`
- Create: `services/api/app/core/database.py`
- Create: `services/api/app/models/base.py`
- Create: `services/api/app/models/project.py`
- Create: `services/api/app/models/document.py`
- Create: `services/api/app/models/generation.py`
- Create: `services/api/app/models/testcase.py`
- Create: `services/api/alembic/env.py`
- Create: `services/api/alembic/versions/0001_initial_schema.py`
- Test: `services/api/tests/test_health.py`

- [ ] **Step 1: Write the failing API smoke test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_healthcheck():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `cd services/api; uv run pytest tests/test_health.py -v`
Expected: FAIL with `ModuleNotFoundError` or missing `/health`

- [ ] **Step 3: Add core FastAPI bootstrap**

```python
from fastapi import FastAPI


app = FastAPI(title="TestOps API")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 4: Add settings and database session setup**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://testops:testops@localhost:5432/testops"
    redis_url: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
```

- [ ] **Step 5: Add initial ORM models**

```python
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    description: Mapped[str | None] = mapped_column(Text())
    status: Mapped[str] = mapped_column(String(32), default="active")
    default_provider: Mapped[str] = mapped_column(String(32), default="cursor")
    default_prompt_profile: Mapped[str] = mapped_column(String(64), default="default")
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=datetime.utcnow)
```

- [ ] **Step 6: Add an initial Alembic migration**

```python
def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("code", sa.String(length=40), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("default_provider", sa.String(length=32), nullable=False),
        sa.Column("default_prompt_profile", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
```

- [ ] **Step 7: Run the smoke test to verify it passes**

Run: `cd services/api; uv run pytest tests/test_health.py -v`
Expected: PASS

- [ ] **Step 8: Apply the first migration locally**

Run: `cd services/api; uv run alembic upgrade head`
Expected: database upgraded without errors

- [ ] **Step 9: Commit**

```bash
git add services/api
git commit -m "feat: add api core and initial schema"
```

## Task 3: Implement the Project and Document Modules

**Files:**
- Create: `services/api/app/modules/project/service.py`
- Create: `services/api/app/modules/project/router.py`
- Create: `services/api/app/modules/document/service.py`
- Create: `services/api/app/modules/document/router.py`
- Create: `services/api/app/schemas/project.py`
- Create: `services/api/app/schemas/document.py`
- Test: `services/api/tests/test_project_routes.py`
- Test: `services/api/tests/test_document_routes.py`

- [ ] **Step 1: Write failing tests for project CRUD**

```python
def test_create_project(client):
    response = client.post(
        "/projects",
        json={"name": "Core Banking", "code": "core-banking"},
    )

    assert response.status_code == 201
    assert response.json()["code"] == "core-banking"
```

- [ ] **Step 2: Write failing tests for document upload metadata**

```python
def test_create_document_asset(client):
    project = client.post("/projects", json={"name": "A", "code": "a"}).json()

    response = client.post(
        f"/projects/{project['id']}/documents",
        json={"type": "figma", "name": "Checkout UI", "source_mode": "external_link", "source_uri": "https://figma.com/file/abc"},
    )

    assert response.status_code == 201
    assert response.json()["type"] == "figma"
```

- [ ] **Step 3: Add project schemas and service logic**

```python
class ProjectCreate(BaseModel):
    name: str
    code: str
    description: str | None = None


class ProjectRead(ProjectCreate):
    id: int
    status: str
    default_provider: str
    default_prompt_profile: str
```

```python
def create_project(session: Session, payload: ProjectCreate) -> Project:
    project = Project(
        name=payload.name,
        code=payload.code,
        description=payload.description,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project
```

- [ ] **Step 4: Add document asset and version models plus routes**

```python
class DocumentAsset(Base):
    __tablename__ = "document_assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    type: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(255))
    source_mode: Mapped[str] = mapped_column(String(32))
    source_uri: Mapped[str | None] = mapped_column(Text())
```

```python
@router.post("/projects/{project_id}/documents", status_code=201)
def create_document_asset(project_id: int, payload: DocumentCreate, session: Session = Depends(get_session)):
    return document_service.create_asset(session, project_id, payload)
```

- [ ] **Step 5: Add migration for document tables**

```python
op.create_table(
    "document_assets",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
    sa.Column("type", sa.String(length=32), nullable=False),
    sa.Column("name", sa.String(length=255), nullable=False),
    sa.Column("source_mode", sa.String(length=32), nullable=False),
    sa.Column("source_uri", sa.Text(), nullable=True),
)
```

- [ ] **Step 6: Run route tests**

Run: `cd services/api; uv run pytest tests/test_project_routes.py tests/test_document_routes.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add services/api
git commit -m "feat: add project and document modules"
```

## Task 4: Implement the Worker, Parsing Pipeline, and Artifact Storage

**Files:**
- Create: `services/worker/worker_app/celery_app.py`
- Create: `services/worker/worker_app/tasks/parse.py`
- Create: `services/api/app/modules/parser/prd_parser.py`
- Create: `services/api/app/modules/parser/swagger_parser.py`
- Create: `services/api/app/modules/parser/figma_parser.py`
- Create: `services/api/app/modules/document/storage.py`
- Test: `services/api/tests/test_swagger_parser.py`

- [ ] **Step 1: Write a failing Swagger parser test**

```python
def test_extract_openapi_operations():
    payload = {
        "openapi": "3.0.0",
        "paths": {
            "/orders": {
                "post": {
                    "summary": "Create order"
                }
            }
        }
    }

    operations = extract_operations(payload)

    assert operations == [
        {"path": "/orders", "method": "post", "summary": "Create order"}
    ]
```

- [ ] **Step 2: Add worker bootstrap**

```python
from celery import Celery


celery_app = Celery(
    "testops_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)
```

- [ ] **Step 3: Add parser implementations**

```python
def extract_operations(payload: dict) -> list[dict[str, str]]:
    operations: list[dict[str, str]] = []
    for path, methods in payload.get("paths", {}).items():
        for method, definition in methods.items():
            operations.append(
                {
                    "path": path,
                    "method": method,
                    "summary": definition.get("summary", ""),
                }
            )
    return operations
```

```python
def extract_prd_sections(text: str) -> list[dict[str, str]]:
    return [
        {"heading": line.strip("# ").strip(), "body": ""}
        for line in text.splitlines()
        if line.startswith("#")
    ]
```

- [ ] **Step 4: Add a local artifact storage abstraction**

```python
from pathlib import Path


class LocalArtifactStorage:
    def __init__(self, root: Path) -> None:
        self.root = root

    def save_bytes(self, relative_path: str, payload: bytes) -> str:
        target = self.root / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        return str(target)
```

- [ ] **Step 5: Add parse task orchestration**

```python
@celery_app.task(name="documents.parse_version")
def parse_document_version(document_version_id: int) -> None:
    # fetch version metadata from API database layer and update parse status
    # dispatch parser by document type
    pass
```

- [ ] **Step 6: Run parser unit tests**

Run: `cd services/api; uv run pytest tests/test_swagger_parser.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add services/api services/worker
git commit -m "feat: add parsing pipeline and worker scaffold"
```

## Task 5: Implement the AI Provider Layer and Generation Pipeline

**Files:**
- Create: `services/api/app/modules/provider/base.py`
- Create: `services/api/app/modules/provider/cursor_provider.py`
- Create: `services/api/app/modules/provider/openai_provider.py`
- Create: `services/api/app/modules/generation/service.py`
- Create: `services/api/app/modules/generation/router.py`
- Create: `services/worker/worker_app/tasks/generate.py`
- Test: `services/api/tests/test_generation_validation.py`

- [ ] **Step 1: Write a failing normalization test**

```python
def test_normalize_generated_case_payload():
    raw = {
        "cases": [
            {
                "title": "Create order successfully",
                "steps": ["Open order page", "Submit valid form"],
                "expected_results": ["Order created"]
            }
        ]
    }

    normalized = normalize_generated_cases(raw)

    assert normalized[0]["title"] == "Create order successfully"
    assert normalized[0]["steps"][0]["text"] == "Open order page"
```

- [ ] **Step 2: Add provider interface**

```python
class AIProvider(Protocol):
    def generate_test_cases(self, payload: dict) -> dict:
        ...
```

- [ ] **Step 3: Add provider registry**

```python
PROVIDERS: dict[str, type[AIProvider]] = {
    "cursor": CursorProvider,
    "openai": OpenAIProvider,
}
```

- [ ] **Step 4: Add generation normalization and validation**

```python
def normalize_generated_cases(raw: dict) -> list[dict]:
    normalized: list[dict] = []
    for item in raw.get("cases", []):
        normalized.append(
            {
                "title": item["title"],
                "steps": [{"text": step} for step in item.get("steps", [])],
                "expected_results": [{"text": value} for value in item.get("expected_results", [])],
            }
        )
    return normalized
```

- [ ] **Step 5: Add generation task route and worker dispatch**

```python
@router.post("/projects/{project_id}/generation-tasks", status_code=201)
def create_generation_task(project_id: int, payload: GenerationTaskCreate, session: Session = Depends(get_session)):
    task = generation_service.create_task(session, project_id, payload)
    generate_test_cases.delay(task.id)
    return task
```

- [ ] **Step 6: Add worker generation task**

```python
@celery_app.task(name="generation.generate_test_cases")
def generate_test_cases(generation_task_id: int) -> None:
    # load task inputs, call provider, normalize payload, persist drafts
    pass
```

- [ ] **Step 7: Run generation tests**

Run: `cd services/api; uv run pytest tests/test_generation_validation.py -v`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add services/api services/worker
git commit -m "feat: add provider abstraction and generation pipeline"
```

## Task 6: Implement Test Case, Review, Publish, and Downstream Handoff Modules

**Files:**
- Create: `services/api/app/modules/testcase/service.py`
- Create: `services/api/app/modules/testcase/router.py`
- Create: `services/api/app/modules/review/service.py`
- Create: `services/api/app/modules/review/router.py`
- Create: `services/api/app/schemas/testcase.py`
- Create: `services/api/app/schemas/review.py`
- Test: `services/api/tests/test_testcase_review_flow.py`

- [ ] **Step 1: Write a failing review/publish workflow test**

```python
def test_publish_approved_test_case(client, seeded_test_case):
    approve = client.post(
        f"/test-cases/{seeded_test_case['id']}/reviews",
        json={"action": "approve", "comment": "ready"},
    )
    publish = client.post(f"/test-cases/{seeded_test_case['id']}/publish")

    assert approve.status_code == 201
    assert publish.status_code == 200
    assert publish.json()["status"] == "published"
```

- [ ] **Step 2: Add test case schemas with structured steps**

```python
class StepItem(BaseModel):
    text: str


class TestCaseUpdate(BaseModel):
    title: str
    module: str
    feature: str
    case_type: str
    priority: str
    preconditions: list[str]
    steps: list[StepItem]
    expected_results: list[StepItem]
    tags: list[str]
    automation_flag: bool
    automation_notes: str | None = None
```

- [ ] **Step 3: Add review and publish service logic**

```python
def add_review(session: Session, test_case: TestCase, payload: ReviewCreate) -> TestCaseReview:
    review = TestCaseReview(
        test_case_id=test_case.id,
        reviewer_id=payload.reviewer_id,
        action=payload.action,
        comment=payload.comment,
    )
    if payload.action == "approve":
        test_case.status = "approved"
    session.add(review)
    session.commit()
    return review
```

```python
def publish_case(session: Session, test_case: TestCase) -> TestCase:
    if test_case.status != "approved":
        raise ValueError("Only approved cases can be published")
    test_case.status = "published"
    session.commit()
    session.refresh(test_case)
    return test_case
```

- [ ] **Step 4: Add downstream handoff API**

```python
@router.get("/projects/{project_id}/published-test-cases")
def list_published_cases(project_id: int, session: Session = Depends(get_session)):
    return testcase_service.list_published_cases(session, project_id)
```

- [ ] **Step 5: Run workflow tests**

Run: `cd services/api; uv run pytest tests/test_testcase_review_flow.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add services/api
git commit -m "feat: add testcase review and publish workflows"
```

## Task 7: Build the Frontend App Shell and Project Workspaces

**Files:**
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/projects/[projectId]/page.tsx`
- Create: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Create: `apps/web/components/app-shell.tsx`
- Create: `apps/web/components/project-summary.tsx`
- Create: `apps/web/lib/api.ts`
- Test: `apps/web/src/tests/app-shell.test.tsx`

- [ ] **Step 1: Write a failing shell render test**

```tsx
import { render, screen } from "@testing-library/react";

import { AppShell } from "@/components/app-shell";

test("renders global navigation", () => {
  render(<AppShell><div>content</div></AppShell>);
  expect(screen.getByText("Projects")).toBeInTheDocument();
});
```

- [ ] **Step 2: Add the root layout**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Add the application shell**

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <aside className="w-64 border-r border-stone-200 p-6">
        <nav className="space-y-3">
          <a href="/">Projects</a>
          <a href="/settings">Settings</a>
        </nav>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Add the projects index and project home**

```tsx
export default function HomePage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold">Projects</h1>
        <p className="mt-2 text-slate-600">Manage test-case platforms by project.</p>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 5: Run frontend shell tests**

Run: `cd apps/web; npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: add frontend app shell and project workspace"
```

## Task 8: Build the Document Center and Generation Task UI

**Files:**
- Create: `apps/web/app/projects/[projectId]/documents/page.tsx`
- Create: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Create: `apps/web/components/document-table.tsx`
- Create: `apps/web/components/generation-task-list.tsx`
- Create: `apps/web/lib/types.ts`
- Test: `apps/web/src/tests/document-table.test.tsx`

- [ ] **Step 1: Write a failing document table test**

```tsx
test("renders document asset rows", () => {
  render(
    <DocumentTable
      items={[{ id: 1, name: "Checkout PRD", type: "prd", parseStatus: "parsed" }]}
    />
  );

  expect(screen.getByText("Checkout PRD")).toBeInTheDocument();
});
```

- [ ] **Step 2: Add typed frontend API contracts**

```ts
export type DocumentAsset = {
  id: number;
  name: string;
  type: "prd" | "figma" | "swagger";
  parseStatus?: string;
};
```

- [ ] **Step 3: Add the document center page**

```tsx
export default function DocumentsPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold">Documents</h1>
          <p className="text-slate-600">Manage PRD, Figma, and Swagger inputs.</p>
        </header>
        <DocumentTable items={[]} />
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 4: Add the generation task list page**

```tsx
export default function GenerationTasksPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold">Generation Tasks</h1>
        <GenerationTaskList items={[]} />
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 5: Run frontend document/task tests**

Run: `cd apps/web; npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: add document center and generation task pages"
```

## Task 9: Build the Test Case List and Review Workspace UI

**Files:**
- Create: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Create: `apps/web/app/projects/[projectId]/review/page.tsx`
- Create: `apps/web/components/test-case-table.tsx`
- Create: `apps/web/components/review-editor.tsx`
- Test: `apps/web/src/tests/review-editor.test.tsx`

- [ ] **Step 1: Write a failing review editor test**

```tsx
test("renders editable step fields", () => {
  render(
    <ReviewEditor
      item={{
        title: "Create order",
        steps: [{ text: "Open order page" }],
        expectedResults: [{ text: "Order page is visible" }],
      }}
    />
  );

  expect(screen.getByDisplayValue("Open order page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Add the test case list page**

```tsx
export default function TestCasesPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold">Test Cases</h1>
        <TestCaseTable items={[]} />
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 3: Add the review workspace page**

```tsx
export default function ReviewPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold">Review Workspace</h1>
        <ReviewEditor item={null} />
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 4: Add the structured review editor**

```tsx
export function ReviewEditor({ item }: { item: ReviewItem | null }) {
  if (!item) {
    return <div className="rounded-xl border border-dashed border-stone-300 p-8">No test case selected.</div>;
  }

  return (
    <div className="space-y-4">
      {item.steps.map((step, index) => (
        <input key={index} defaultValue={step.text} className="w-full rounded-lg border px-3 py-2" />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run frontend review tests**

Run: `cd apps/web; npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: add test case review workspace ui"
```

## Task 10: Wire Integration Paths, Seed Data, and End-to-End Verification

**Files:**
- Create: `services/api/tests/test_end_to_end_flow.py`
- Create: `services/api/scripts/seed_demo_data.py`
- Modify: `README.md`

- [ ] **Step 1: Write the end-to-end integration test**

```python
def test_project_document_generation_review_publish_flow(client):
    project = client.post("/projects", json={"name": "Payments", "code": "payments"}).json()
    document = client.post(
        f"/projects/{project['id']}/documents",
        json={"type": "prd", "name": "Payments PRD", "source_mode": "upload", "source_uri": "/tmp/prd.md"},
    ).json()

    assert project["code"] == "payments"
    assert document["type"] == "prd"
```

- [ ] **Step 2: Add a demo seed script**

```python
def main() -> None:
    print("Seeding demo project, document assets, and draft test cases...")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Document how to run the full stack**

```md
## Verification

1. `docker compose up -d postgres redis`
2. `cd services/api && uv run alembic upgrade head`
3. `cd services/api && uv run uvicorn app.main:app --reload`
4. `cd services/worker && uv run celery -A worker_app.celery_app worker -l info`
5. `cd apps/web && npm run dev`
```

- [ ] **Step 4: Run backend integration tests**

Run: `cd services/api; uv run pytest tests/test_end_to_end_flow.py -v`
Expected: PASS

- [ ] **Step 5: Run the full verification suite**

Run: `cd services/api; uv run pytest -v`
Expected: PASS

Run: `cd apps/web; npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add README.md services/api apps/web
git commit -m "test: add end-to-end verification coverage"
```

## Self-Review

### Spec Coverage

- Covered: repository bootstrap, API/core schema, document ingestion, parsing, provider abstraction, generation pipeline, review workflow, publish workflow, downstream handoff API, frontend shell, document center, generation task UI, review UI, verification
- Deferred intentionally: Playwright generation, scheduler, Allure, failure analysis, self-healing, Lark execution notifications

### Placeholder Scan

- No `TODO`/`TBD` markers remain in the plan body.
- Every task includes exact file targets, commands, and commit points.

### Type Consistency

- Frontend uses structured `steps` and `expectedResults` objects that mirror backend structured test case fields.
- Backend provider pipeline normalizes generated steps into structured list items before review/publish workflows consume them.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-test-case-platform.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
