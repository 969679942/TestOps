# Project Archiving Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build project archiving and restore so archived projects are hidden from the default list, can be restored from an archived view, and block active workflow mutations without deleting data.

**Architecture:** Extend the existing `projects.status` field to model `active` and `archived`, add filtered list and status update endpoints in the API, and surface archive/restore controls in both the project directory and project detail pages. Guard write-path services on the backend so archived projects remain readable but cannot continue active flows, then mirror that state in the web UI with disabled actions and archive banners.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, pytest, Next.js App Router, TypeScript, Vitest

---

## File Structure

### API

- Create: `services/api/alembic/versions/0017_add_project_archived_state.py`
- Modify: `services/api/app/schemas/project.py`
- Modify: `services/api/app/modules/project/router.py`
- Modify: `services/api/app/modules/project/service.py`
- Modify: `services/api/app/modules/document/service.py`
- Modify: `services/api/app/modules/generation/service.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/schedule/service.py`
- Test: `services/api/tests/test_project_routes.py`
- Test: `services/api/tests/test_document_routes.py`
- Test: `services/api/tests/test_generation_validation.py`
- Test: `services/api/tests/test_testcase_review_flow.py`
- Test: `services/api/tests/test_schedule_flow.py`

### Web

- Modify: `apps/web/lib/workspace-api.ts`
- Modify: `apps/web/lib/copy.ts`
- Modify: `apps/web/lib/i18n.ts` (only if new labels/status translations need central mapping)
- Modify: `apps/web/components/project-directory.tsx`
- Create: `apps/web/components/project-status-action.tsx`
- Create: `apps/web/components/project-archive-banner.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/page.tsx`
- Modify: `apps/web/components/project-workspace-tabs.tsx`
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/automation-schedules/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/new/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/project-directory.test.tsx`
- Test: `apps/web/src/tests/pages.test.tsx`
- Test: `apps/web/src/tests/api.test.ts`

## Task 1: Add Project Status Filtering And Archive/Restore API

**Files:**
- Create: `services/api/alembic/versions/0017_add_project_archived_state.py`
- Modify: `services/api/app/schemas/project.py`
- Modify: `services/api/app/modules/project/router.py`
- Modify: `services/api/app/modules/project/service.py`
- Test: `services/api/tests/test_project_routes.py`

- [ ] **Step 1: Write the failing API tests for filtered list and status update**

```python
def test_list_projects_defaults_to_active_only(client):
    active = client.post("/projects", json={"name": "Active Project", "code": "active-project"}).json()
    archived = client.post("/projects", json={"name": "Archived Project", "code": "archived-project"}).json()

    update = client.patch(
        f"/projects/{archived['id']}/status",
        json={"status": "archived"},
    )
    assert update.status_code == 200

    response = client.get("/projects")

    assert response.status_code == 200
    assert [item["code"] for item in response.json()] == ["active-project"]


def test_list_project_summaries_can_return_archived_projects(client):
    project = client.post("/projects", json={"name": "Archived Summary", "code": "archived-summary"}).json()
    client.patch(f"/projects/{project['id']}/status", json={"status": "archived"})

    response = client.get("/project-summaries?status=archived")

    assert response.status_code == 200
    assert [item["code"] for item in response.json()] == ["archived-summary"]


def test_patch_project_status_restores_archived_project(client):
    project = client.post("/projects", json={"name": "Restorable", "code": "restorable"}).json()
    client.patch(f"/projects/{project['id']}/status", json={"status": "archived"})

    response = client.patch(
        f"/projects/{project['id']}/status",
        json={"status": "active"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "active"


def test_patch_project_status_rejects_unknown_status(client):
    project = client.post("/projects", json={"name": "Invalid", "code": "invalid-status"}).json()

    response = client.patch(
        f"/projects/{project['id']}/status",
        json={"status": "deleted"},
    )

    assert response.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest services/api/tests/test_project_routes.py -v`
Expected: FAIL because `PATCH /projects/{id}/status` and query filtering are not implemented.

- [ ] **Step 3: Add schema types for status filter and project status update**

```python
class ProjectStatusUpdate(BaseModel):
    status: Literal["active", "archived"]


ProjectStatusFilter = Literal["active", "archived", "all"]
```

Add these to `services/api/app/schemas/project.py` alongside `ProjectCreate`, `ProjectRead`, and `ProjectSummaryRead`.

- [ ] **Step 4: Implement service support for filtered lists and status updates**

```python
def _apply_project_status_filter(statement, status_filter: str):
    if status_filter == "all":
        return statement
    return statement.where(Project.status == status_filter)


def list_projects(session: Session, *, status_filter: str = "active") -> list[Project]:
    statement = select(Project).order_by(Project.id)
    statement = _apply_project_status_filter(statement, status_filter)
    return list(session.scalars(statement))


def update_project_status(session: Session, project_id: int, status_value: str) -> Project:
    project = get_project(session, project_id)
    project.status = status_value
    session.add(project)
    session.commit()
    session.refresh(project)
    return project
```

Use the same `status_filter` support inside `list_project_summaries`.

- [ ] **Step 5: Implement router query params and PATCH endpoint**

```python
@router.get("/projects", response_model=list[ProjectRead])
def list_projects(
    status: ProjectStatusFilter = Query(default="active"),
    session: Session = Depends(get_session),
) -> list[ProjectRead]:
    return project_service.list_projects(session, status_filter=status)


@router.patch("/projects/{project_id}/status", response_model=ProjectRead)
def update_project_status(
    project_id: int,
    payload: ProjectStatusUpdate,
    session: Session = Depends(get_session),
) -> ProjectRead:
    return project_service.update_project_status(session, project_id, payload.status)
```

Mirror the same query param on `GET /project-summaries`.

- [ ] **Step 6: Add migration for archived project state compatibility**

```python
def upgrade() -> None:
    op.alter_column(
        "projects",
        "status",
        existing_type=sa.String(length=32),
        server_default="active",
        existing_nullable=False,
    )
    op.execute("UPDATE projects SET status = 'active' WHERE status IS NULL OR status = ''")


def downgrade() -> None:
    op.alter_column(
        "projects",
        "status",
        existing_type=sa.String(length=32),
        server_default="active",
        existing_nullable=False,
    )
```

Keep this migration minimal: it does not add a new column, it normalizes the existing one.

- [ ] **Step 7: Run tests to verify project API passes**

Run: `pytest services/api/tests/test_project_routes.py -v`
Expected: PASS with archive, restore, and filter coverage.

- [ ] **Step 8: Commit**

```bash
git add services/api/alembic/versions/0017_add_project_archived_state.py services/api/app/schemas/project.py services/api/app/modules/project/router.py services/api/app/modules/project/service.py services/api/tests/test_project_routes.py
git commit -m "feat: add project archiving status endpoints"
```

## Task 2: Guard Archived Projects From Write Paths

**Files:**
- Modify: `services/api/app/modules/project/service.py`
- Modify: `services/api/app/modules/document/service.py`
- Modify: `services/api/app/modules/generation/service.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/schedule/service.py`
- Test: `services/api/tests/test_document_routes.py`
- Test: `services/api/tests/test_generation_validation.py`
- Test: `services/api/tests/test_testcase_review_flow.py`
- Test: `services/api/tests/test_schedule_flow.py`

- [ ] **Step 1: Write failing tests for archived write protection**

```python
def test_archived_project_rejects_document_creation(client):
    project = client.post("/projects", json={"name": "Docs Locked", "code": "docs-locked"}).json()
    client.patch(f"/projects/{project['id']}/status", json={"status": "archived"})

    response = client.post(
        f"/projects/{project['id']}/documents",
        json={
            "type": "prd",
            "name": "Product Spec",
            "source_mode": "url",
            "source_uri": "https://example.test/prd",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Project is archived. Restore it before making changes."
```

```python
def test_archived_project_rejects_generation_task_creation(client):
    project = client.post("/projects", json={"name": "Generation Locked", "code": "generation-locked"}).json()
    client.patch(f"/projects/{project['id']}/status", json={"status": "archived"})

    response = client.post(
        f"/projects/{project['id']}/generation-tasks",
        json={"input_document_ids": [], "provider": "cursor"},
    )

    assert response.status_code == 409
```

Add equivalent tests for test case import/create and schedule creation/update.

- [ ] **Step 2: Run the targeted backend tests to confirm failure**

Run: `pytest services/api/tests/test_document_routes.py services/api/tests/test_generation_validation.py services/api/tests/test_testcase_review_flow.py services/api/tests/test_schedule_flow.py -v`
Expected: FAIL because archived projects are still treated as active.

- [ ] **Step 3: Add a reusable project activity assertion helper**

```python
def ensure_project_is_active(project: Project) -> Project:
    if project.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project is archived. Restore it before making changes.",
        )
    return project
```

Place this in `services/api/app/modules/project/service.py` so every module can import the same guard and error message.

- [ ] **Step 4: Use the guard in document, generation, testcase, and schedule write paths**

```python
project = _get_project(session, project_id)
project_service.ensure_project_is_active(project)
```

Apply this pattern at the start of:
- document asset creation
- document upload
- generation task creation
- test case create/import
- schedule create/update when the owning project is archived

- [ ] **Step 5: Verify read-only paths remain available**

Keep list/detail methods unchanged so archived projects can still be read:

```python
def list_test_cases(session: Session, project_id: int) -> list[TestCase]:
    _get_project_or_404(session, project_id)
    ...
```

Do not add active-only guards to read methods.

- [ ] **Step 6: Run the targeted backend suite**

Run: `pytest services/api/tests/test_document_routes.py services/api/tests/test_generation_validation.py services/api/tests/test_testcase_review_flow.py services/api/tests/test_schedule_flow.py -v`
Expected: PASS with `409` responses on archived writes and no regressions on read paths.

- [ ] **Step 7: Commit**

```bash
git add services/api/app/modules/project/service.py services/api/app/modules/document/service.py services/api/app/modules/generation/service.py services/api/app/modules/testcase/service.py services/api/app/modules/schedule/service.py services/api/tests/test_document_routes.py services/api/tests/test_generation_validation.py services/api/tests/test_testcase_review_flow.py services/api/tests/test_schedule_flow.py
git commit -m "feat: block archived projects from active workflows"
```

## Task 3: Add Web API Support And Shared Archive UI Copy

**Files:**
- Modify: `apps/web/lib/workspace-api.ts`
- Modify: `apps/web/lib/copy.ts`
- Test: `apps/web/src/tests/api.test.ts`

- [ ] **Step 1: Write failing frontend API tests for project filtering and status updates**

```ts
it("requests active projects by default when loading project summaries", async () => {
  fetchMock.mockResolvedValue(jsonResponse([]));

  await listProjectsWithStats();

  expect(fetchMock).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/project-summaries?status=active",
    expect.objectContaining({ cache: "no-store" }),
  );
});

it("updates a project to archived status", async () => {
  fetchMock.mockResolvedValue(
    jsonResponse({
      id: 12,
      name: "Archived Project",
      code: "archived-project",
      description: null,
      status: "archived",
      default_provider: "cursor",
      default_prompt_profile: "default",
    }),
  );

  await expect(updateProjectStatus("12", "archived")).resolves.toMatchObject({
    status: "archived",
  });
});
```

- [ ] **Step 2: Run the API unit tests to confirm they fail**

Run: `npm test -- src/tests/api.test.ts`
Expected: FAIL because list filtering and status update helpers do not exist yet.

- [ ] **Step 3: Extend the web API client**

```ts
export type ProjectStatusFilter = "active" | "archived" | "all";

export async function listProjectsWithStats(
  status: ProjectStatusFilter = "active",
): Promise<ProjectSummaryRecord[]> {
  const projects = await requestJson<ProjectSummaryApiRecord[]>(
    `/project-summaries?status=${status}`,
  );
  return projects.map(mapProjectSummary);
}

export async function updateProjectStatus(
  projectId: string,
  status: "active" | "archived",
): Promise<ProjectRecord> {
  const project = await requestJson<ProjectApiRecord>(`/projects/${projectId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return mapProject(project);
}
```

Keep `listProjects()` aligned with the same query param style if that helper is still used in fallbacks.

- [ ] **Step 4: Add shared archive-related copy**

```ts
archiveProject: "归档项目",
restoreProject: "恢复项目",
activeProjects: "进行中",
archivedProjects: "已归档",
projectArchived: "项目已归档",
projectArchivedHint: "该项目已归档，可查看历史数据。如需继续操作，请先恢复项目。",
archiveProjectConfirm: "归档后项目将从默认列表隐藏，但不会删除已有数据。",
restoreProjectConfirm: "恢复后项目将重新出现在默认列表，并可继续使用。",
archivedProjectActionHint: "项目已归档，请先恢复后再继续操作",
```

Place them in `apps/web/lib/copy.ts`, next to the existing project/workspace copy.

- [ ] **Step 5: Run the frontend API tests**

Run: `npm test -- src/tests/api.test.ts`
Expected: PASS with the new query parameter and status update mapping.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/workspace-api.ts apps/web/lib/copy.ts apps/web/src/tests/api.test.ts
git commit -m "feat: add web project archive api helpers"
```

## Task 4: Build Archive/Restore Controls In Project Directory And Detail

**Files:**
- Create: `apps/web/components/project-status-action.tsx`
- Create: `apps/web/components/project-archive-banner.tsx`
- Modify: `apps/web/components/project-directory.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/project-directory.test.tsx`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write failing UI tests for project directory archive views**

```tsx
it("shows active projects by default and can switch to archived projects", async () => {
  const html = renderToStaticMarkup(
    <ProjectDirectory
      projects={[
        { id: "1", name: "Active", code: "active", status: "active", description: null, defaultProvider: "cursor", defaultPromptProfile: "default", documentCount: 0, testCaseCount: 0, publishedCount: 0 },
        { id: "2", name: "Archived", code: "archived", status: "archived", description: null, defaultProvider: "cursor", defaultPromptProfile: "default", documentCount: 0, testCaseCount: 0, publishedCount: 0 },
      ]}
    />,
  );

  expect(html).toContain("进行中");
  expect(html).toContain("已归档");
  expect(html).toContain("归档项目");
});
```

Add a page test asserting archived project detail shows the archive banner.

- [ ] **Step 2: Run the affected web tests to confirm failure**

Run: `npm test -- src/tests/project-directory.test.tsx src/tests/pages.test.tsx`
Expected: FAIL because archive toggles and banners are not rendered.

- [ ] **Step 3: Create a reusable project status action component**

```tsx
type ProjectStatusActionProps = {
  projectId: string;
  status: "active" | "archived";
  onUpdated?: (status: "active" | "archived") => void;
};

export function ProjectStatusAction({ projectId, status, onUpdated }: ProjectStatusActionProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    const nextStatus = status === "archived" ? "active" : "archived";
    const confirmed = window.confirm(
      nextStatus === "archived" ? copy.archiveProjectConfirm : copy.restoreProjectConfirm,
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const updated = await updateProjectStatus(projectId, nextStatus);
      onUpdated?.(updated.status as "active" | "archived");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button className="button-secondary" type="button" disabled={submitting} onClick={handleClick}>
      {status === "archived" ? copy.restoreProject : copy.archiveProject}
    </button>
  );
}
```

- [ ] **Step 4: Add archive view switching to the project directory**

```tsx
const [view, setView] = useState<"active" | "archived">("active");
const [items, setItems] = useState(projects);

const visibleProjects = items.filter((project) => project.status === view);
```

Update each card to render `ProjectStatusAction`, and refresh local list state when a project is archived or restored instead of forcing a full page refresh.

- [ ] **Step 5: Add archive controls and banner to project detail**

```tsx
<section className="page-header">
  <div className="page-header-actions">
    <div>
      <span className="eyebrow">{copy.workspaceEyebrow}</span>
      <h2>{projectDisplayName}</h2>
      <p>{projectDescription}</p>
    </div>
    <ProjectStatusAction projectId={projectId} status={project.status as "active" | "archived"} />
  </div>
</section>

{project.status === "archived" ? <ProjectArchiveBanner /> : null}
```

Keep the banner content in the new `project-archive-banner.tsx` component so the same presentation can be reused elsewhere.

- [ ] **Step 6: Add styling for view toggles, header actions, and archive banner**

```css
.project-filter-tabs {
  display: inline-flex;
  gap: 8px;
}

.project-archive-banner {
  border: 1px solid var(--border);
  background: #f8fafc;
  color: var(--text);
}
```

Place these rules near the existing project-directory and page-header styles in `apps/web/app/globals.css`.

- [ ] **Step 7: Run the directory and page tests**

Run: `npm test -- src/tests/project-directory.test.tsx src/tests/pages.test.tsx`
Expected: PASS with archive controls and banner coverage.

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/project-status-action.tsx apps/web/components/project-archive-banner.tsx apps/web/components/project-directory.tsx apps/web/app/page.tsx apps/web/app/projects/[projectId]/page.tsx apps/web/app/globals.css apps/web/src/tests/project-directory.test.tsx apps/web/src/tests/pages.test.tsx
git commit -m "feat: add project archive controls to web ui"
```

## Task 5: Disable Active Workflow Actions For Archived Projects

**Files:**
- Modify: `apps/web/components/project-workspace-tabs.tsx`
- Modify: `apps/web/app/projects/[projectId]/generation-tasks/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/automation-schedules/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/new/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write failing tests for archived project action locks**

```tsx
it("shows archived project action hint on the workspace page", async () => {
  getWorkspaceProjectMock.mockResolvedValue({
    ...workspaceProject,
    status: "archived",
  });

  const html = renderToStaticMarkup(
    await ProjectWorkspacePage({
      params: Promise.resolve({ projectId: "1" }),
      searchParams: Promise.resolve({}),
    }),
  );

  expect(html).toContain("项目已归档，请先恢复后再继续操作");
});
```

Add assertions that archived generation/schedule/new-case pages show disabled primary actions or guidance instead of active creation controls.

- [ ] **Step 2: Run the page test file to confirm failure**

Run: `npm test -- src/tests/pages.test.tsx`
Expected: FAIL because archived pages still render active workflow buttons.

- [ ] **Step 3: Thread project status through workspace controls**

```tsx
<ProjectWorkspaceTabs
  projectId={projectId}
  documents={documents}
  defaultProvider={project.defaultProvider}
  onGeneratingChange={setGenerating}
  projectStatus={project.status}
/>
```

Then inside `project-workspace-tabs.tsx`:

```tsx
const archived = projectStatus === "archived";
```

Use `archived` to disable the generate/import/new-case actions and show `copy.archivedProjectActionHint`.

- [ ] **Step 4: Add archive-aware gating to generation, schedule, and new test case pages**

```tsx
const archived = project.status === "archived";

{archived ? (
  <ProjectArchiveBanner />
) : (
  <button className="button-primary">...</button>
)}
```

For pages where a form should still render for context, keep the layout but disable submit buttons and render the shared hint above the form.

- [ ] **Step 5: Reuse consistent disabled-state styling**

```css
.archived-action-lock {
  padding: 12px 16px;
  border: 1px solid var(--border);
  background: var(--panel-muted);
  color: var(--muted);
}
```

Use one shared class for archive action guidance so all pages match.

- [ ] **Step 6: Run the page tests again**

Run: `npm test -- src/tests/pages.test.tsx`
Expected: PASS with archived action locks covered.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/project-workspace-tabs.tsx apps/web/app/projects/[projectId]/generation-tasks/page.tsx apps/web/app/projects/[projectId]/automation-schedules/page.tsx apps/web/app/projects/[projectId]/test-cases/new/page.tsx apps/web/app/projects/[projectId]/page.tsx apps/web/app/globals.css apps/web/src/tests/pages.test.tsx
git commit -m "feat: lock archived projects across workflow pages"
```

## Task 6: Run Full Regression And Update Local Runbook Notes

**Files:**
- Modify: `docs/local-runbook.md`
- Test: `services/api/tests/test_project_routes.py`
- Test: `services/api/tests/test_document_routes.py`
- Test: `services/api/tests/test_generation_validation.py`
- Test: `services/api/tests/test_testcase_review_flow.py`
- Test: `services/api/tests/test_schedule_flow.py`
- Test: `apps/web/src/tests/api.test.ts`
- Test: `apps/web/src/tests/project-directory.test.tsx`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Add a short runbook note about archived projects**

```md
## Project lifecycle

- Active projects appear in the default project list.
- Archived projects move to the archived view and remain readable.
- Archived projects reject document, generation, testcase, and schedule write operations until restored.
```

Append this to `docs/local-runbook.md` near the project/workspace workflow notes.

- [ ] **Step 2: Run the targeted backend regression suite**

Run: `pytest services/api/tests/test_project_routes.py services/api/tests/test_document_routes.py services/api/tests/test_generation_validation.py services/api/tests/test_testcase_review_flow.py services/api/tests/test_schedule_flow.py -v`
Expected: PASS

- [ ] **Step 3: Run the frontend regression suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Run the frontend production build**

Run: `cmd /c "set PATH=C:\Users\Administrator\AppData\Local\OpenAI\Codex\bin;%PATH%&& npm run build"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/local-runbook.md
git commit -m "docs: document archived project behavior"
```

## Self-Review

### Spec coverage

- Project supports archive and restore: covered by Task 1 and Task 4.
- Default list hides archived projects and adds archived view toggle: covered by Task 1, Task 3, and Task 4.
- Directory and detail pages both expose archive/restore: covered by Task 4.
- Archived projects preserve data but block active write flows: covered by Task 2 and Task 5.
- Frontend and backend regression coverage: covered by Task 6.

### Placeholder scan

- No `TODO`, `TBD`, or “handle appropriately” placeholders remain.
- Each task includes explicit file paths, code snippets, commands, and expected results.

### Type consistency

- Status values are consistently `active` and `archived`.
- Web API helper and backend patch payload both use `status`.
- Shared lock message and archive banner are reused instead of duplicating slightly different strings.
