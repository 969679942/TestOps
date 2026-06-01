# Test Case Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the test case list, new-case editor, and detail page into one unified enterprise-style workspace with a real two-level directory tree while preserving upload-generated cases, import, preview review, and the current review/publish flow.

**Architecture:** Add a project-scoped `test_case_directories` model plus `directory_id` on test cases, expose directory CRUD and tree-aware listing in the API, then reshape the web client into a left-tree/right-table list workspace and a shared two-column editor surface for both create and detail flows. Existing generation, import, and preview-review actions stay intact, but move into clearer toolbar and side-panel affordances rather than living inside the main editor body.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, pytest, Next.js App Router, React, TypeScript, Vitest

---

## File Structure

### API

- Create: `services/api/alembic/versions/0018_add_test_case_directories.py`
- Create: `services/api/app/models/testcase_directory.py`
- Modify: `services/api/app/models/__init__.py`
- Modify: `services/api/app/models/testcase.py`
- Modify: `services/api/app/schemas/testcase.py`
- Create: `services/api/app/schemas/testcase_directory.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/testcase/router.py`
- Test: `services/api/tests/test_testcase_review_flow.py`
- Test: `services/api/tests/test_testcase_import.py`

### Web Data Layer

- Modify: `apps/web/lib/workspace-api.ts`
- Modify: `apps/web/lib/ui-automation-case.ts`
- Modify: `apps/web/lib/copy.ts`
- Modify: `apps/web/lib/types.ts` (if page-level helpers still consume shared test-case shape)
- Test: `apps/web/src/tests/workspace-api.test.ts`
- Test: `apps/web/src/tests/api.test.ts`

### Web UI

- Create: `apps/web/components/test-case-directory-tree.tsx`
- Create: `apps/web/components/test-case-list-workspace.tsx`
- Create: `apps/web/components/test-case-results-table.tsx`
- Create: `apps/web/components/test-case-metadata-sidebar.tsx`
- Create: `apps/web/components/test-case-step-table-editor.tsx`
- Modify: `apps/web/components/test-case-composer.tsx`
- Modify: `apps/web/components/test-case-review-panel.tsx`
- Modify: `apps/web/components/test-case-import-panel.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/new/page.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/[testCaseId]/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/pages.test.tsx`
- Create: `apps/web/src/tests/test-case-directory-tree.test.tsx`
- Create: `apps/web/src/tests/test-case-composer-layout.test.tsx`

## Task 1: Add Real Test Case Directory Data Model

**Files:**
- Create: `services/api/alembic/versions/0018_add_test_case_directories.py`
- Create: `services/api/app/models/testcase_directory.py`
- Modify: `services/api/app/models/__init__.py`
- Modify: `services/api/app/models/testcase.py`
- Create: `services/api/app/schemas/testcase_directory.py`
- Test: `services/api/tests/test_testcase_review_flow.py`

- [ ] **Step 1: Write the failing API tests for directory creation and tree listing**

```python
def test_create_directory_supports_parent_child_tree(client):
    project = client.post("/projects", json={"name": "目录项目", "code": "catalog-project"}).json()

    root = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "测试特性目录", "parent_id": None},
    )
    child = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "登录", "parent_id": root.json()["id"]},
    )

    assert root.status_code == 201
    assert child.status_code == 201

    listing = client.get(f"/projects/{project['id']}/test-case-directories")

    assert listing.status_code == 200
    assert listing.json() == [
        {
            "id": root.json()["id"],
            "project_id": project["id"],
            "name": "测试特性目录",
            "parent_id": None,
            "children": [
                {
                    "id": child.json()["id"],
                    "project_id": project["id"],
                    "name": "登录",
                    "parent_id": root.json()["id"],
                    "children": [],
                }
            ],
        }
    ]


def test_create_directory_rejects_third_level_nodes(client):
    project = client.post("/projects", json={"name": "层级项目", "code": "depth-project"}).json()
    root = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "一级目录", "parent_id": None},
    ).json()
    child = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "二级目录", "parent_id": root["id"]},
    ).json()

    response = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "三级目录", "parent_id": child["id"]},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Only two directory levels are supported."
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest services/api/tests/test_testcase_review_flow.py -k directory -v`  
Expected: FAIL because `test-case-directories` routes and model do not exist.

- [ ] **Step 3: Add the new SQLAlchemy model and testcase foreign key**

```python
class TestCaseDirectory(Base):
    __tablename__ = "test_case_directories"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("test_case_directories.id"),
        nullable=True,
    )
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
```

```python
directory_id: Mapped[int | None] = mapped_column(
    ForeignKey("test_case_directories.id"),
    nullable=True,
)
```

- [ ] **Step 4: Create the Alembic migration**

```python
def upgrade() -> None:
    op.create_table(
        "test_case_directories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("test_case_directories.id"), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.add_column("test_cases", sa.Column("directory_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_test_cases_directory_id",
        "test_cases",
        "test_case_directories",
        ["directory_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_test_cases_directory_id", "test_cases", type_="foreignkey")
    op.drop_column("test_cases", "directory_id")
    op.drop_table("test_case_directories")
```

- [ ] **Step 5: Add Pydantic schemas for create, read, and tree response**

```python
class TestCaseDirectoryCreate(BaseModel):
    name: NonEmptyStr
    parent_id: int | None = None


class TestCaseDirectoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    parent_id: int | None
    children: list["TestCaseDirectoryRead"] = Field(default_factory=list)
```

- [ ] **Step 6: Run the focused API tests**

Run: `pytest services/api/tests/test_testcase_review_flow.py -k directory -v`  
Expected: PASS with create, list, and depth-limit coverage.

- [ ] **Step 7: Commit**

```bash
git add services/api/alembic/versions/0018_add_test_case_directories.py services/api/app/models/testcase_directory.py services/api/app/models/__init__.py services/api/app/models/testcase.py services/api/app/schemas/testcase_directory.py services/api/tests/test_testcase_review_flow.py
git commit -m "feat: add test case directory data model"
```

## Task 2: Wire Directory Logic Into Test Case CRUD And Filtering

**Files:**
- Modify: `services/api/app/schemas/testcase.py`
- Modify: `services/api/app/modules/testcase/service.py`
- Modify: `services/api/app/modules/testcase/router.py`
- Test: `services/api/tests/test_testcase_review_flow.py`
- Test: `services/api/tests/test_testcase_import.py`

- [ ] **Step 1: Write failing tests for directory-aware case creation, import, and filtering**

```python
def test_create_test_case_assigns_directory(client):
    project = client.post("/projects", json={"name": "用例目录项目", "code": "case-dir-project"}).json()
    root = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "测试特性目录"},
    ).json()

    response = client.post(
        f"/projects/{project['id']}/test-cases",
        json={
            "title": "登录成功",
            "module": "认证",
            "feature": "登录",
            "case_type": "functional",
            "priority": "p1",
            "preconditions": ["已打开登录页"],
            "steps": [{"text": "输入账号"}],
            "expected_results": [{"text": "账号框显示已输入值"}],
            "tags": ["smoke"],
            "directory_id": root["id"],
        },
    )

    assert response.status_code == 201
    assert response.json()["directory_id"] == root["id"]


def test_list_test_cases_filters_by_root_directory_including_children(client):
    project = client.post("/projects", json={"name": "筛选项目", "code": "filter-project"}).json()
    root = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "测试特性目录"},
    ).json()
    child = client.post(
        f"/projects/{project['id']}/test-case-directories",
        json={"name": "登录", "parent_id": root["id"]},
    ).json()

    for title, directory_id in [("登录成功", child["id"]), ("注册成功", None)]:
        client.post(
            f"/projects/{project['id']}/test-cases",
            json={
                "title": title,
                "module": "认证",
                "feature": "账户",
                "case_type": "functional",
                "priority": "p1",
                "preconditions": ["前置条件"],
                "steps": [{"text": "步骤"}],
                "expected_results": [{"text": "结果"}],
                "tags": [],
                "directory_id": directory_id,
            },
        )

    response = client.get(f"/projects/{project['id']}/test-cases?directory_id={root['id']}")

    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["登录成功"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest services/api/tests/test_testcase_review_flow.py services/api/tests/test_testcase_import.py -k directory -v`  
Expected: FAIL because `directory_id` is not accepted or filtered.

- [ ] **Step 3: Extend test case schemas with `directory_id` and list filter query params**

```python
class TestCaseCreate(BaseModel):
    ...
    directory_id: int | None = None


class TestCaseUpdate(BaseModel):
    ...
    directory_id: int | None = None


class TestCaseRead(BaseModel):
    ...
    directory_id: int | None
```

- [ ] **Step 4: Add service helpers for directory validation and root aggregation**

```python
def _validate_directory(session: Session, project_id: int, directory_id: int | None) -> TestCaseDirectory | None:
    if directory_id is None:
        return None
    directory = session.scalar(
        select(TestCaseDirectory).where(
            TestCaseDirectory.id == directory_id,
            TestCaseDirectory.project_id == project_id,
        )
    )
    if directory is None:
        raise HTTPException(status_code=404, detail="Test case directory not found")
    return directory


def _directory_scope_ids(session: Session, project_id: int, directory_id: int) -> list[int]:
    directory = _validate_directory(session, project_id, directory_id)
    if directory is None:
        return []
    children = session.scalars(
        select(TestCaseDirectory.id).where(TestCaseDirectory.parent_id == directory.id)
    )
    return [directory.id, *list(children)]
```

- [ ] **Step 5: Store `directory_id` during create, import, and update**

```python
test_case = TestCase(
    project_id=project_id,
    title=payload.title,
    module=payload.module,
    feature=payload.feature,
    ...
    directory_id=payload.directory_id,
)
```

Also validate that imported cases can carry `directory_id=None` safely and that updates reject directories from another project.

- [ ] **Step 6: Add router support for listing directories and filtered cases**

```python
@router.get("/projects/{project_id}/test-case-directories", response_model=list[TestCaseDirectoryRead])
def list_test_case_directories(...):
    return testcase_service.list_test_case_directories(session, project_id)


@router.post("/projects/{project_id}/test-case-directories", response_model=TestCaseDirectoryRead, status_code=201)
def create_test_case_directory(...):
    return testcase_service.create_test_case_directory(session, project_id, payload)


@router.get("/projects/{project_id}/test-cases", response_model=list[TestCaseRead])
def list_test_cases(project_id: int, directory_id: int | None = None, session: Session = Depends(get_session)):
    return testcase_service.list_test_cases(session, project_id, directory_id=directory_id)
```

- [ ] **Step 7: Run the API tests**

Run: `pytest services/api/tests/test_testcase_review_flow.py services/api/tests/test_testcase_import.py -v`  
Expected: PASS with directory-aware create/import/list/update coverage.

- [ ] **Step 8: Commit**

```bash
git add services/api/app/schemas/testcase.py services/api/app/modules/testcase/service.py services/api/app/modules/testcase/router.py services/api/tests/test_testcase_review_flow.py services/api/tests/test_testcase_import.py
git commit -m "feat: add directory-aware test case CRUD"
```

## Task 3: Extend The Web API Layer And Draft Model

**Files:**
- Modify: `apps/web/lib/workspace-api.ts`
- Modify: `apps/web/lib/ui-automation-case.ts`
- Modify: `apps/web/lib/copy.ts`
- Test: `apps/web/src/tests/workspace-api.test.ts`
- Test: `apps/web/src/tests/api.test.ts`

- [ ] **Step 1: Write failing web data-layer tests for directories and directory-linked cases**

```ts
it("maps test case directory trees from the workspace API", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: 10,
        project_id: 1,
        name: "测试特性目录",
        parent_id: null,
        children: [{ id: 11, project_id: 1, name: "登录", parent_id: 10, children: [] }],
      },
    ],
  } as Response);

  await expect(listProjectTestCaseDirectories("1")).resolves.toEqual([
    {
      id: "10",
      projectId: "1",
      name: "测试特性目录",
      parentId: null,
      children: [{ id: "11", projectId: "1", name: "登录", parentId: "10", children: [] }],
    },
  ]);
});


it("serializes directory_id when creating a test case", () => {
  const draft = createEmptyTestCaseDraft();
  draft.title = "登录成功";
  draft.module = "认证";
  draft.feature = "登录";
  draft.directoryId = "11";

  expect(serializeDraftForApi(draft)).toMatchObject({
    directory_id: 11,
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run: `npm test -- src/tests/workspace-api.test.ts src/tests/api.test.ts`  
Expected: FAIL because directory APIs and `directoryId` are missing.

- [ ] **Step 3: Extend the client-side types**

```ts
export type TestCaseDirectoryRecord = {
  id: string;
  projectId: string;
  name: string;
  parentId: string | null;
  children: TestCaseDirectoryRecord[];
};

export type TestCaseRecord = {
  ...
  directoryId: string | null;
};
```

```ts
export type TestCaseDraft = {
  ...
  directoryId: string | null;
  owner: string;
  releaseVersion: string;
  iteration: string;
  attachments: string[];
  linkedRequirement: string;
};
```

- [ ] **Step 4: Add workspace API functions and mappers**

```ts
export async function listProjectTestCaseDirectories(projectId: string): Promise<TestCaseDirectoryRecord[]> {
  const directories = await requestJson<TestCaseDirectoryApiRecord[]>(
    `/projects/${projectId}/test-case-directories`,
  );
  return directories.map(mapDirectoryTree);
}

export async function createProjectTestCaseDirectory(
  projectId: string,
  input: { name: string; parentId: string | null },
): Promise<TestCaseDirectoryRecord> {
  const created = await requestJson<TestCaseDirectoryApiRecord>(
    `/projects/${projectId}/test-case-directories`,
    {
      method: "POST",
      body: JSON.stringify({ name: input.name, parent_id: input.parentId ? Number(input.parentId) : null }),
    },
  );
  return mapDirectoryTree(created);
}
```

- [ ] **Step 5: Update draft serialization and hydration**

```ts
export function createEmptyTestCaseDraft(): TestCaseDraft {
  return {
    title: "",
    module: "",
    feature: "",
    caseType: "functional",
    priority: "p2",
    ...
    directoryId: null,
    owner: "",
    releaseVersion: "",
    iteration: "",
    attachments: [],
    linkedRequirement: "",
  };
}
```

```ts
directory_id: draft.directoryId ? Number(draft.directoryId) : null,
```

- [ ] **Step 6: Run the web data-layer tests**

Run: `npm test -- src/tests/workspace-api.test.ts src/tests/api.test.ts`  
Expected: PASS with directory mapping and payload serialization.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/workspace-api.ts apps/web/lib/ui-automation-case.ts apps/web/lib/copy.ts apps/web/src/tests/workspace-api.test.ts apps/web/src/tests/api.test.ts
git commit -m "feat: add web support for test case directories"
```

## Task 4: Rebuild The Test Case List Page As Tree + Table Workspace

**Files:**
- Create: `apps/web/components/test-case-directory-tree.tsx`
- Create: `apps/web/components/test-case-results-table.tsx`
- Create: `apps/web/components/test-case-list-workspace.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/page.tsx`
- Modify: `apps/web/components/test-case-import-panel.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/pages.test.tsx`
- Create: `apps/web/src/tests/test-case-directory-tree.test.tsx`

- [ ] **Step 1: Write the failing UI tests for the left-tree/right-table layout**

```tsx
it("renders a real directory tree and table toolbar on the test cases page", async () => {
  listWorkspaceProjectTestCasesMock.mockResolvedValue([
    { id: "21", projectId: "1", title: "登录成功", module: "认证", feature: "登录", priority: "p1", status: "draft", steps: [], expectedResults: [], tags: [], automationFlag: false, automationNotes: null, uiContext: null, publishedAt: null, caseType: "functional", directoryId: "11" },
  ]);
  listWorkspaceProjectTestCaseDirectoriesMock.mockResolvedValue([
    {
      id: "10",
      projectId: "1",
      name: "测试特性目录",
      parentId: null,
      children: [{ id: "11", projectId: "1", name: "登录", parentId: "10", children: [] }],
    },
  ]);

  const html = renderToStaticMarkup(await ProjectTestCasesPage({ params: Promise.resolve({ projectId: "1" }) }));

  expect(html).toContain("test-case-tree");
  expect(html).toContain("测试特性目录");
  expect(html).toContain("登录");
  expect(html).toContain("新建用例");
  expect(html).toContain("上传资料生成");
  expect(html).toContain("导入用例");
});
```

- [ ] **Step 2: Run the page tests to verify failure**

Run: `npm test -- src/tests/pages.test.tsx src/tests/test-case-directory-tree.test.tsx`  
Expected: FAIL because the new workspace components do not exist.

- [ ] **Step 3: Build the directory tree component**

```tsx
export function TestCaseDirectoryTree({
  items,
  selectedId,
  onSelect,
}: {
  items: TestCaseDirectoryRecord[];
  selectedId: string | null;
  onSelect: (directoryId: string | null) => void;
}) {
  return (
    <aside className="test-case-tree" aria-label="测试特性目录">
      <button
        className={selectedId === null ? "tree-node is-active" : "tree-node"}
        type="button"
        onClick={() => onSelect(null)}
      >
        全部用例
      </button>
      {items.map((item) => (
        <div key={item.id} className="tree-group">
          <button
            className={selectedId === item.id ? "tree-node is-active" : "tree-node"}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            {item.name}
          </button>
          <div className="tree-children">
            {item.children.map((child) => (
              <button
                key={child.id}
                className={selectedId === child.id ? "tree-node is-active tree-node-child" : "tree-node tree-node-child"}
                type="button"
                onClick={() => onSelect(child.id)}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 4: Build the table workspace and preserve existing actions**

```tsx
<section className="test-case-list-workspace">
  <div className="test-case-toolbar">
    <Link className="button-primary" href={`/projects/${projectId}/test-cases/new`}>
      + {copy.createTestCase}
    </Link>
    <Link className="button-secondary" href={`/projects/${projectId}`}>
      {copy.uploadAndGenerate}
    </Link>
    <Link className="button-secondary" href={`/projects/${projectId}?mode=import`}>
      {copy.importCases}
    </Link>
    <Link className="button-secondary" href={`/projects/${projectId}/review`}>
      {copy.previewReview}
    </Link>
  </div>
  <div className="test-case-workspace-body">
    <TestCaseDirectoryTree ... />
    <TestCaseResultsTable ... />
  </div>
</section>
```

- [ ] **Step 5: Load directories in the route and pass them into the workspace**

```tsx
const [project, documents, testCases, directories] = await loadOrThrow(() =>
  Promise.all([
    getProject(projectId),
    listProjectDocuments(projectId),
    listProjectTestCases(projectId),
    listProjectTestCaseDirectories(projectId),
  ]),
);
```

- [ ] **Step 6: Run the focused UI tests**

Run: `npm test -- src/tests/pages.test.tsx src/tests/test-case-directory-tree.test.tsx`  
Expected: PASS with the new tree, toolbar, and preserved flow-entry assertions.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/test-case-directory-tree.tsx apps/web/components/test-case-results-table.tsx apps/web/components/test-case-list-workspace.tsx apps/web/app/projects/[projectId]/test-cases/page.tsx apps/web/components/test-case-import-panel.tsx apps/web/app/globals.css apps/web/src/tests/pages.test.tsx apps/web/src/tests/test-case-directory-tree.test.tsx
git commit -m "feat: redesign test case list workspace"
```

## Task 5: Rebuild The Shared Two-Column Test Case Editor

**Files:**
- Create: `apps/web/components/test-case-metadata-sidebar.tsx`
- Create: `apps/web/components/test-case-step-table-editor.tsx`
- Modify: `apps/web/components/test-case-composer.tsx`
- Modify: `apps/web/app/projects/[projectId]/test-cases/new/page.tsx`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/src/tests/test-case-composer-layout.test.tsx`
- Test: `apps/web/src/tests/pages.test.tsx`

- [ ] **Step 1: Write the failing tests for the new editor structure**

```tsx
it("renders the composer as a two-column workspace with a metadata sidebar", () => {
  const html = renderToStaticMarkup(<TestCaseComposer mode="create" projectId="1" />);

  expect(html).toContain("case-composer-layout");
  expect(html).toContain("测试步骤");
  expect(html).toContain("基础信息");
  expect(html).toContain("归属目录");
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm test -- src/tests/test-case-composer-layout.test.tsx src/tests/pages.test.tsx`  
Expected: FAIL because the composer is still a single-column engineering form.

- [ ] **Step 3: Extract the metadata sidebar**

```tsx
export function TestCaseMetadataSidebar({
  draft,
  directories,
  readOnly,
  onChange,
}: {
  draft: TestCaseDraft;
  directories: TestCaseDirectoryRecord[];
  readOnly: boolean;
  onChange: (patch: Partial<TestCaseDraft>) => void;
}) {
  return (
    <aside className="case-metadata-sidebar">
      <section className="sidebar-section">
        <h3>基础信息</h3>
        <label className="field">
          <span>类型</span>
          <select ... />
        </label>
        <label className="field">
          <span>用例等级</span>
          <select ... />
        </label>
        <label className="field">
          <span>归属目录</span>
          <select ... />
        </label>
      </section>
    </aside>
  );
}
```

- [ ] **Step 4: Extract the step table editor**

```tsx
export function TestCaseStepTableEditor({
  steps,
  expectedResults,
  readOnly,
  onChange,
}: {
  steps: UIAutomationStep[];
  expectedResults: { text: string }[];
  readOnly: boolean;
  onChange: (rows: Array<{ step: UIAutomationStep; expected: { text: string } }>) => void;
}) {
  return (
    <section className="step-table-editor">
      <div className="step-table-toolbar">
        <h3>测试步骤</h3>
        {!readOnly ? <button type="button" className="button-ghost">+ 添加步骤</button> : null}
      </div>
      <table className="step-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>步骤描述</th>
            <th>预期结果</th>
          </tr>
        </thead>
      </table>
    </section>
  );
}
```

- [ ] **Step 5: Recompose the page into left editor + right sidebar**

```tsx
<form className="case-composer-layout" onSubmit={handleSubmit}>
  <div className="case-composer-main">
    <label className="field">
      <span>名称</span>
      <input ... />
    </label>
    <label className="field">
      <span>描述</span>
      <textarea ... />
    </label>
    <StringListEditor label="前置条件" ... />
    <TestCaseStepTableEditor ... />
  </div>
  <TestCaseMetadataSidebar ... />
</form>
```

- [ ] **Step 6: Run the editor tests**

Run: `npm test -- src/tests/test-case-composer-layout.test.tsx src/tests/pages.test.tsx`  
Expected: PASS with the new two-column layout and sidebar labels.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/test-case-metadata-sidebar.tsx apps/web/components/test-case-step-table-editor.tsx apps/web/components/test-case-composer.tsx apps/web/app/projects/[projectId]/test-cases/new/page.tsx apps/web/app/globals.css apps/web/src/tests/test-case-composer-layout.test.tsx apps/web/src/tests/pages.test.tsx
git commit -m "feat: redesign test case editor layout"
```

## Task 6: Unify The Detail Page And Preserve Review / Publish Flow

**Files:**
- Modify: `apps/web/app/projects/[projectId]/test-cases/[testCaseId]/page.tsx`
- Modify: `apps/web/components/test-case-review-panel.tsx`
- Modify: `apps/web/components/test-case-composer.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/src/tests/pages.test.tsx`
- Test: `apps/web/src/tests/review-editor.test.tsx`

- [ ] **Step 1: Write the failing page test for unified detail layout**

```tsx
it("renders the test case detail page with editor and review actions in one unified workspace", async () => {
  const html = renderToStaticMarkup(
    await TestCaseDetailPage({
      params: Promise.resolve({ projectId: "1", testCaseId: "21" }),
    }),
  );

  expect(html).toContain("case-detail-workspace");
  expect(html).toContain("基础信息");
  expect(html).toContain("评审记录");
  expect(html).toContain("发布");
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- src/tests/pages.test.tsx src/tests/review-editor.test.tsx`  
Expected: FAIL because detail and review are still separate visual blocks.

- [ ] **Step 3: Collapse the detail page into one workspace shell**

```tsx
<div className="case-detail-workspace">
  <div className="case-detail-main">
    <TestCaseEditor testCase={testCase} directories={directories} />
  </div>
  <aside className="case-detail-side">
    <TestCaseReviewPanel testCase={testCase} reviews={reviews} />
  </aside>
</div>
```

- [ ] **Step 4: Reshape review actions as a sidebar action group**

```tsx
<section className="review-action-panel">
  <header className="review-action-header">
    <h3>评审与发布</h3>
    <StatusBadge status={testCase.status} />
  </header>
  <form ...>
    <textarea name="comment" placeholder="填写评审意见" />
    <div className="inline-actions">
      <button className="button-secondary" formAction={rejectAction}>退回修改</button>
      <button className="button-primary" formAction={approveAction}>批准</button>
      <button className="button-primary" formAction={publishAction}>发布</button>
    </div>
  </form>
</section>
```

- [ ] **Step 5: Run the detail/review tests**

Run: `npm test -- src/tests/pages.test.tsx src/tests/review-editor.test.tsx`  
Expected: PASS with unified detail layout and intact review/publish controls.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/projects/[projectId]/test-cases/[testCaseId]/page.tsx apps/web/components/test-case-review-panel.tsx apps/web/components/test-case-composer.tsx apps/web/app/globals.css apps/web/src/tests/pages.test.tsx apps/web/src/tests/review-editor.test.tsx
git commit -m "feat: unify test case detail and review workspace"
```

## Task 7: Full Verification And Cleanup

**Files:**
- Modify: `apps/web/lib/copy.ts` (only if final terminology cleanup is still needed)
- Modify: `apps/web/app/globals.css` (only if responsive polish is still needed)
- Test: `services/api/tests/test_testcase_review_flow.py`
- Test: `services/api/tests/test_testcase_import.py`
- Test: `apps/web/src/tests/pages.test.tsx`
- Test: `apps/web/src/tests/test-case-directory-tree.test.tsx`
- Test: `apps/web/src/tests/test-case-composer-layout.test.tsx`

- [ ] **Step 1: Run targeted API verification**

Run: `pytest services/api/tests/test_testcase_review_flow.py services/api/tests/test_testcase_import.py -v`  
Expected: PASS with directory CRUD, case assignment, import, and filtering coverage.

- [ ] **Step 2: Run targeted web verification**

Run: `cmd /c "set PATH=C:\Users\Administrator\AppData\Local\OpenAI\Codex\bin;%PATH%&& npm test -- src/tests/pages.test.tsx src/tests/test-case-directory-tree.test.tsx src/tests/test-case-composer-layout.test.tsx"`  
Expected: PASS with the redesigned list and editor surfaces.

- [ ] **Step 3: Run full web verification**

Run: `cmd /c "set PATH=C:\Users\Administrator\AppData\Local\OpenAI\Codex\bin;%PATH%&& npm test"`  
Expected: PASS, no regressions in project directory, review, archive, and routing behavior.

- [ ] **Step 4: Run production build**

Run: `cmd /c "set PATH=C:\Users\Administrator\AppData\Local\OpenAI\Codex\bin;%PATH%&& npm run build"`  
Expected: PASS with `/projects/[projectId]/test-cases`, `/new`, and `/[testCaseId]` still compiling cleanly.

- [ ] **Step 5: Manual browser verification**

Run:

```bash
open http://127.0.0.1:3000/projects/11/test-cases
open http://127.0.0.1:3000/projects/11/test-cases/new
open http://127.0.0.1:3000/projects/11/test-cases/21
```

Expected:
- 列表页展示左侧真实目录树和右侧表格
- 顶部仍可见上传资料生成、导入用例、预览评审入口
- 新建页与详情页都是统一双栏样式
- 目录筛选、保存、评审、发布入口都可达

- [ ] **Step 6: Commit**

```bash
git add services/api/tests/test_testcase_review_flow.py services/api/tests/test_testcase_import.py apps/web/src/tests/pages.test.tsx apps/web/src/tests/test-case-directory-tree.test.tsx apps/web/src/tests/test-case-composer-layout.test.tsx apps/web/lib/copy.ts apps/web/app/globals.css
git commit -m "test: verify redesigned test case workspace"
```

## Self-Review

- **Spec coverage:** The plan covers the real two-level directory model, left-tree/right-table list page, unified create/detail editor, preserved upload/import/preview-review flows, and review/publish continuity. No spec section is currently unmatched.
- **Placeholder scan:** No `TODO`, `TBD`, or "handle later" language remains in tasks. Each implementation step names exact files, commands, and expected outcomes.
- **Type consistency:** The plan uses `directory_id` in the API and `directoryId` in the web layer consistently, and keeps the shared route scope under `/projects/{project_id}/test-cases`.
