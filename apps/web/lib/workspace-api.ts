export type ProjectRecord = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  defaultProvider: string;
  defaultPromptProfile: string;
};

export type ProjectDocumentRecord = {
  id: string;
  projectId: string;
  type: string;
  name: string;
  sourceMode: string;
  sourceUri: string | null;
};

export type TestCaseRecord = {
  id: string;
  projectId: string;
  title: string;
  module: string;
  feature: string;
  caseType: string;
  priority: string;
  preconditions: string[];
  steps: Array<{
    text?: string;
    action?: string;
    target?: string;
    locator_hint?: string;
    locatorHint?: string;
    value?: string;
    assertion?: string;
    timeout_ms?: number;
    timeoutMs?: number;
    order?: number;
  }>;
  expectedResults: { text: string }[];
  tags: string[];
  automationFlag: boolean;
  automationNotes: string | null;
  uiContext: {
    schemaVersion: string;
    framework: string;
    baseUrl: string;
    browser: string;
    viewport: { width: number; height: number };
    entryPath: string;
    entryReadySelector: string;
    testData: Record<string, string>;
    teardown: string;
  } | null;
  status: string;
  publishedAt: string | null;
};

export type GenerationTaskRecord = {
  id: string;
  projectId: string;
  status: string;
  provider: string;
  model: string;
  promptVersion: string;
  inputDocumentIds: number[];
  errorMessage: string | null;
};

export type ReviewRecord = {
  id: string;
  testCaseId: string;
  reviewerId: string;
  action: string;
  comment: string | null;
  createdAt: string;
};

type ProjectApiRecord = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  default_provider: string;
  default_prompt_profile: string;
};

type ProjectDocumentApiRecord = {
  id: number;
  project_id: number;
  type: string;
  name: string;
  source_mode: string;
  source_uri: string | null;
};

type TestCaseApiRecord = {
  id: number;
  project_id: number;
  title: string;
  module: string;
  feature: string;
  case_type: string;
  priority: string;
  preconditions: string[];
  steps: Array<Record<string, unknown>>;
  expected_results: { text: string }[];
  tags: string[];
  automation_flag: boolean;
  automation_notes: string | null;
  ui_context: Record<string, unknown> | null;
  status: string;
  published_at: string | null;
};

type GenerationTaskApiRecord = {
  id: number;
  project_id: number;
  status: string;
  provider: string;
  model: string;
  prompt_version: string;
  input_refs: { document_ids?: number[] };
  error_message: string | null;
};

type ReviewApiRecord = {
  id: number;
  test_case_id: number;
  reviewer_id: string;
  action: string;
  comment: string | null;
  created_at: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_TESTOPS_API_BASE_URL ?? "http://127.0.0.1:8000";
  }

  return (
    process.env.TESTOPS_API_BASE_URL ??
    process.env.NEXT_PUBLIC_TESTOPS_API_BASE_URL ??
    "http://127.0.0.1:8000"
  );
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      return payload.detail.map((item) => JSON.stringify(item)).join("; ");
    }
  } catch {
    // ignore parse failures
  }

  return `Request failed with status ${response.status}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function mapProject(project: ProjectApiRecord): ProjectRecord {
  return {
    id: String(project.id),
    name: project.name,
    code: project.code,
    description: project.description,
    status: project.status,
    defaultProvider: project.default_provider,
    defaultPromptProfile: project.default_prompt_profile,
  };
}

function mapDocument(document: ProjectDocumentApiRecord): ProjectDocumentRecord {
  return {
    id: String(document.id),
    projectId: String(document.project_id),
    type: document.type,
    name: document.name,
    sourceMode: document.source_mode,
    sourceUri: document.source_uri,
  };
}

function mapUiContext(raw: Record<string, unknown> | null): TestCaseRecord["uiContext"] {
  if (!raw) {
    return null;
  }

  const viewportRaw = raw.viewport;
  const viewport =
    viewportRaw && typeof viewportRaw === "object" && !Array.isArray(viewportRaw)
      ? {
          width: Number((viewportRaw as Record<string, unknown>).width ?? 1280),
          height: Number((viewportRaw as Record<string, unknown>).height ?? 720),
        }
      : { width: 1280, height: 720 };

  const testDataRaw = raw.test_data ?? raw.testData;
  const testData: Record<string, string> = {};
  if (testDataRaw && typeof testDataRaw === "object" && !Array.isArray(testDataRaw)) {
    for (const [key, value] of Object.entries(testDataRaw)) {
      testData[key] = String(value);
    }
  }

  return {
    schemaVersion: String(raw.schema_version ?? raw.schemaVersion ?? "ui-automation-v1"),
    framework: String(raw.framework ?? "playwright"),
    baseUrl: String(raw.base_url ?? raw.baseUrl ?? ""),
    browser: String(raw.browser ?? "chromium"),
    viewport,
    entryPath: String(raw.entry_path ?? raw.entryPath ?? ""),
    entryReadySelector: String(raw.entry_ready_selector ?? raw.entryReadySelector ?? ""),
    testData,
    teardown: String(raw.teardown ?? ""),
  };
}

function mapTestCase(testCase: TestCaseApiRecord): TestCaseRecord {
  return {
    id: String(testCase.id),
    projectId: String(testCase.project_id),
    title: testCase.title,
    module: testCase.module,
    feature: testCase.feature,
    caseType: testCase.case_type,
    priority: testCase.priority,
    preconditions: testCase.preconditions,
    steps: testCase.steps,
    expectedResults: testCase.expected_results,
    tags: testCase.tags,
    automationFlag: testCase.automation_flag,
    automationNotes: testCase.automation_notes,
    uiContext: mapUiContext(testCase.ui_context),
    status: testCase.status,
    publishedAt: testCase.published_at,
  };
}

function mapGenerationTask(task: GenerationTaskApiRecord): GenerationTaskRecord {
  return {
    id: String(task.id),
    projectId: String(task.project_id),
    status: task.status,
    provider: task.provider,
    model: task.model,
    promptVersion: task.prompt_version,
    inputDocumentIds: task.input_refs.document_ids ?? [],
    errorMessage: task.error_message,
  };
}

function mapReview(review: ReviewApiRecord): ReviewRecord {
  return {
    id: String(review.id),
    testCaseId: String(review.test_case_id),
    reviewerId: review.reviewer_id,
    action: review.action,
    comment: review.comment,
    createdAt: review.created_at,
  };
}

type ProjectSummaryApiRecord = ProjectApiRecord & {
  document_count: number;
  test_case_count: number;
  published_count: number;
};

export type ProjectSummaryRecord = ProjectRecord & {
  documentCount: number;
  testCaseCount: number;
  publishedCount: number;
};

function mapProjectSummary(project: ProjectSummaryApiRecord): ProjectSummaryRecord {
  return {
    ...mapProject(project),
    documentCount: project.document_count,
    testCaseCount: project.test_case_count,
    publishedCount: project.published_count,
  };
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const projects = await requestJson<ProjectApiRecord[]>("/projects");
  return projects.map(mapProject);
}

async function enrichProjectsWithStats(
  projects: ProjectRecord[],
): Promise<ProjectSummaryRecord[]> {
  return Promise.all(
    projects.map(async (project) => {
      const [documents, testCases] = await Promise.all([
        listProjectDocuments(project.id),
        listProjectTestCases(project.id),
      ]);

      return {
        ...project,
        documentCount: documents.length,
        testCaseCount: testCases.length,
        publishedCount: testCases.filter((item) => item.status === "published").length,
      };
    }),
  );
}

export async function listProjectsWithStats(): Promise<ProjectSummaryRecord[]> {
  try {
    const projects = await requestJson<ProjectSummaryApiRecord[]>("/project-summaries");
    return projects.map(mapProjectSummary);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) {
      return enrichProjectsWithStats(await listProjects());
    }
    throw error;
  }
}

export async function getProject(projectId: string): Promise<ProjectRecord> {
  const project = await requestJson<ProjectApiRecord>(`/projects/${projectId}`);
  return mapProject(project);
}

export async function createProject(input: {
  name: string;
  code: string;
  description?: string;
}): Promise<ProjectRecord> {
  const project = await requestJson<ProjectApiRecord>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return mapProject(project);
}

export async function listProjectDocuments(
  projectId: string,
): Promise<ProjectDocumentRecord[]> {
  const documents = await requestJson<ProjectDocumentApiRecord[]>(
    `/projects/${projectId}/documents`,
  );
  return documents.map(mapDocument);
}

export async function createProjectDocument(
  projectId: string,
  input: {
    type: string;
    name: string;
    sourceMode: string;
    sourceUri?: string | null;
  },
): Promise<ProjectDocumentRecord> {
  const document = await requestJson<ProjectDocumentApiRecord>(
    `/projects/${projectId}/documents`,
    {
      method: "POST",
      body: JSON.stringify({
        type: input.type,
        name: input.name,
        source_mode: input.sourceMode,
        source_uri: input.sourceUri ?? null,
      }),
    },
  );
  return mapDocument(document);
}

export async function uploadProjectDocument(
  projectId: string,
  input: {
    file: File;
    type: string;
    name: string;
    sourceMode?: string;
  },
): Promise<ProjectDocumentRecord> {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("type", input.type);
  formData.append("name", input.name);
  formData.append("source_mode", input.sourceMode ?? "upload");

  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/documents/upload`, {
    method: "POST",
    body: formData,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  const document = (await response.json()) as ProjectDocumentApiRecord;
  return mapDocument(document);
}

export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
): Promise<void> {
  await requestJson<void>(`/projects/${projectId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function listProjectTestCases(projectId: string): Promise<TestCaseRecord[]> {
  const testCases = await requestJson<TestCaseApiRecord[]>(
    `/projects/${projectId}/test-cases`,
  );
  return testCases.map(mapTestCase);
}

export async function importTestCases(
  projectId: string,
  cases: Array<ReturnType<typeof import("./ui-automation-case").serializeDraftForApi>>,
): Promise<TestCaseRecord[]> {
  const imported = await requestJson<TestCaseApiRecord[]>(
    `/projects/${projectId}/test-cases/import`,
    {
      method: "POST",
      body: JSON.stringify({
        cases: cases.map((testCase) => ({
          title: testCase.title,
          module: testCase.module,
          feature: testCase.feature,
          case_type: testCase.caseType,
          priority: testCase.priority,
          preconditions: testCase.preconditions ?? [],
          steps: testCase.steps,
          expected_results: testCase.expectedResults,
          tags: testCase.tags ?? [],
          automation_flag: testCase.automationFlag ?? true,
          automation_notes: testCase.automationNotes ?? null,
          ui_context: testCase.uiContext,
        })),
      }),
    },
  );
  return imported.map(mapTestCase);
}

export type CreateTestCaseInput = ReturnType<
  typeof import("./ui-automation-case").serializeDraftForApi
>;

export async function createTestCase(
  projectId: string,
  input: CreateTestCaseInput,
): Promise<TestCaseRecord> {
  const testCase = await requestJson<TestCaseApiRecord>(`/projects/${projectId}/test-cases`, {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      module: input.module,
      feature: input.feature,
      case_type: input.caseType,
      priority: input.priority,
      preconditions: input.preconditions ?? [],
      steps: input.steps,
      expected_results: input.expectedResults,
      tags: input.tags ?? [],
      automation_flag: input.automationFlag ?? true,
      automation_notes: input.automationNotes ?? null,
      ui_context: input.uiContext,
    }),
  });
  return mapTestCase(testCase);
}

export async function getTestCase(testCaseId: string): Promise<TestCaseRecord> {
  const testCase = await requestJson<TestCaseApiRecord>(`/test-cases/${testCaseId}`);
  return mapTestCase(testCase);
}

export async function updateTestCase(
  testCaseId: string,
  input: Partial<CreateTestCaseInput>,
): Promise<TestCaseRecord> {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.module !== undefined) payload.module = input.module;
  if (input.feature !== undefined) payload.feature = input.feature;
  if (input.caseType !== undefined) payload.case_type = input.caseType;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.preconditions !== undefined) payload.preconditions = input.preconditions;
  if (input.steps !== undefined) payload.steps = input.steps;
  if (input.expectedResults !== undefined) payload.expected_results = input.expectedResults;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.automationFlag !== undefined) payload.automation_flag = input.automationFlag;
  if (input.automationNotes !== undefined) payload.automation_notes = input.automationNotes;
  if (input.uiContext !== undefined) payload.ui_context = input.uiContext;

  const testCase = await requestJson<TestCaseApiRecord>(`/test-cases/${testCaseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapTestCase(testCase);
}

export async function listGenerationTasks(
  projectId: string,
): Promise<GenerationTaskRecord[]> {
  const tasks = await requestJson<GenerationTaskApiRecord[]>(
    `/projects/${projectId}/generation-tasks`,
  );
  return tasks.map(mapGenerationTask);
}

export async function createGenerationTask(
  projectId: string,
  input: { documentIds: number[]; provider?: string },
): Promise<GenerationTaskRecord> {
  const task = await requestJson<GenerationTaskApiRecord>(
    `/projects/${projectId}/generation-tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        provider: input.provider ?? "mock",
        input_document_ids: input.documentIds,
      }),
    },
  );
  return mapGenerationTask(task);
}

export async function getGenerationTask(taskId: string): Promise<GenerationTaskRecord> {
  const task = await requestJson<GenerationTaskApiRecord>(`/generation-tasks/${taskId}`);
  return mapGenerationTask(task);
}

export async function waitForGenerationTask(
  taskId: string,
  options?: { intervalMs?: number; timeoutMs?: number },
): Promise<GenerationTaskRecord> {
  const intervalMs = options?.intervalMs ?? 1500;
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const task = await getGenerationTask(taskId);
    if (task.status === "completed" || task.status === "failed") {
      return task;
    }
    await new Promise((resolve) => {
      window.setTimeout(resolve, intervalMs);
    });
  }

  throw new Error("生成任务超时，请稍后在用例列表查看进度。");
}

export async function listTestCaseReviews(testCaseId: string): Promise<ReviewRecord[]> {
  const reviews = await requestJson<ReviewApiRecord[]>(`/test-cases/${testCaseId}/reviews`);
  return reviews.map(mapReview);
}

export async function addTestCaseReview(
  testCaseId: string,
  input: { reviewerId: string; action: string; comment?: string },
): Promise<ReviewRecord> {
  const review = await requestJson<ReviewApiRecord>(`/test-cases/${testCaseId}/reviews`, {
    method: "POST",
    body: JSON.stringify({
      reviewer_id: input.reviewerId,
      action: input.action,
      comment: input.comment ?? null,
    }),
  });
  return mapReview(review);
}

export async function publishTestCase(testCaseId: string): Promise<TestCaseRecord> {
  const testCase = await requestJson<TestCaseApiRecord>(`/test-cases/${testCaseId}/publish`, {
    method: "POST",
  });
  return mapTestCase(testCase);
}
