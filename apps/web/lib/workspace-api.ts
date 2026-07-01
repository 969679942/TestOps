import {
  addTestCaseReview as addTestCaseReviewApi,
  createProject as createProjectApi,
  createProjectDocument as createProjectDocumentApi,
  createTestCase as createTestCaseApi,
  deleteProject as deleteProjectApi,
  deleteProjectDocument as deleteProjectDocumentApi,
  getProject as getProjectApi,
  getTestCase as getTestCaseApi,
  importTestCases as importTestCasesApi,
  listProjectDocuments as listProjectDocumentsApi,
  listProjects as listProjectsApi,
  listProjectsWithStats as listProjectsWithStatsApi,
  listProjectTestCaseDirectories as listProjectTestCaseDirectoriesApi,
  listProjectTestCases as listProjectTestCasesApi,
  listTestCaseReviews as listTestCaseReviewsApi,
  publishTestCase as publishTestCaseApi,
  updateProjectStatus as updateProjectStatusApi,
  updateTestCase as updateTestCaseApi,
  uploadProjectDocument as uploadProjectDocumentApi,
} from "./api";
import type {
  CreateReviewPayload,
  ProjectStatus as ApiProjectStatus,
  ProjectStatusFilter as ApiProjectStatusFilter,
  ProjectSummaryRecord as ApiProjectSummaryRecord,
  ReviewRecord as ApiReviewRecord,
} from "./api";
import type {
  DocumentAsset,
  ProjectRecord as ApiProjectRecord,
  TestCaseDirectoryRecord as ApiTestCaseDirectoryRecord,
  TestCaseMutationPayload,
  TestCaseRecord as ApiTestCaseRecord,
} from "./types";

export type ProjectRecord = Omit<ApiProjectRecord, "id"> & {
  id: string;
};

export type ProjectDocumentRecord = Omit<DocumentAsset, "id" | "projectId"> & {
  id: string;
  projectId: string;
};

export type TestCaseDirectoryRecord = Omit<
  ApiTestCaseDirectoryRecord,
  "id" | "projectId" | "parentId" | "children"
> & {
  id: string;
  projectId: string;
  parentId: string | null;
  children: TestCaseDirectoryRecord[];
};

export type TestCaseRecord = Omit<ApiTestCaseRecord, "id" | "projectId" | "directoryId"> & {
  id: string;
  projectId: string;
  directoryId: string | null;
  uiContext: Exclude<ApiTestCaseRecord["uiContext"], undefined>;
  publishedAt: Exclude<ApiTestCaseRecord["publishedAt"], undefined>;
};

export type ProjectSummaryRecord = Omit<ApiProjectSummaryRecord, "id"> & {
  id: string;
};

export type ReviewRecord = ApiReviewRecord;
export type ProjectStatus = ApiProjectStatus;
export type ProjectStatusFilter = ApiProjectStatusFilter;
export type CreateTestCaseInput = ReturnType<
  typeof import("./ui-automation-case").serializeDraftForApi
>;

type RequestResult<T> =
  | {
      kind: "success";
      data: T;
    }
  | {
      kind: "unavailable";
    }
  | {
      kind: "http-error";
      status: number;
    };

type ProjectListResult = {
  kind: "success" | "unavailable";
  projects: ApiProjectRecord[];
} | {
  kind: "http-error";
  status: number;
};

type ProjectLookupResult =
  | {
      kind: "success";
      project: ApiProjectRecord;
    }
  | {
      kind: "unavailable";
      project: ApiProjectRecord | null;
    }
  | {
      kind: "not-found";
    }
  | {
      kind: "http-error";
      status: number;
    };

type DocumentListResult = {
  kind: "success" | "unavailable";
  documents: DocumentAsset[];
} | {
  kind: "http-error";
  status: number;
};

type TestCaseListResult = {
  kind: "success" | "unavailable";
  items: ApiTestCaseRecord[];
} | {
  kind: "http-error";
  status: number;
};

type AddReviewInput = {
  reviewerId: string;
  action: "comment" | "request_change" | "approve" | "reject";
  comment?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function throwFromResult<T>(result: RequestResult<T>, fallbackMessage: string): never {
  if (result.kind === "http-error") {
    throw new ApiError(fallbackMessage, result.status);
  }

  throw new ApiError(fallbackMessage, 503);
}

function unwrapData<T>(result: RequestResult<T>, fallbackMessage: string): T {
  if (result.kind === "success") {
    return result.data;
  }

  return throwFromResult(result, fallbackMessage);
}

function mapProject(project: ApiProjectRecord): ProjectRecord {
  return {
    ...project,
    id: String(project.id),
  };
}

function mapProjectSummary(project: ApiProjectSummaryRecord): ProjectSummaryRecord {
  return {
    ...project,
    id: String(project.id),
  };
}

function mapDocument(document: DocumentAsset): ProjectDocumentRecord {
  return {
    ...document,
    id: String(document.id),
    projectId: String(document.projectId),
  };
}

function mapTestCaseDirectory(directory: ApiTestCaseDirectoryRecord): TestCaseDirectoryRecord {
  return {
    ...directory,
    id: String(directory.id),
    projectId: String(directory.projectId),
    parentId: directory.parentId === null ? null : String(directory.parentId),
    children: directory.children.map(mapTestCaseDirectory),
  };
}

function mapTestCase(testCase: ApiTestCaseRecord): TestCaseRecord {
  return {
    ...testCase,
    id: String(testCase.id),
    projectId: String(testCase.projectId),
    directoryId: testCase.directoryId === null ? null : String(testCase.directoryId),
    uiContext: testCase.uiContext ?? null,
    publishedAt: testCase.publishedAt ?? null,
  };
}

function toTestCaseMutationPayload(
  input: Partial<CreateTestCaseInput>,
): Partial<TestCaseMutationPayload> {
  const payload: Partial<TestCaseMutationPayload> = {};

  if (input.title !== undefined) payload.title = input.title;
  if (input.module !== undefined) payload.module = input.module;
  if (input.feature !== undefined) payload.feature = input.feature;
  if (input.caseType !== undefined) payload.case_type = input.caseType;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.preconditions !== undefined) payload.preconditions = input.preconditions;
  if (input.steps !== undefined) {
    payload.steps = input.steps as TestCaseMutationPayload["steps"];
  }
  if (input.expectedResults !== undefined) payload.expected_results = input.expectedResults;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.automationFlag !== undefined) payload.automation_flag = input.automationFlag;
  if (input.automationNotes !== undefined) payload.automation_notes = input.automationNotes;
  if (input.linkedRequirement !== undefined) {
    payload.linked_requirement = input.linkedRequirement?.trim() || null;
  }
  if (input.sourceRefs !== undefined) payload.source_refs = input.sourceRefs;
  if (input.generationTaskId !== undefined) {
    payload.generation_task_id = input.generationTaskId ? Number(input.generationTaskId) : null;
  }
  if (input.directoryId !== undefined) {
    payload.directory_id = input.directoryId ? Number(input.directoryId) : null;
  }
  if (input.uiContext !== undefined) payload.ui_context = input.uiContext;

  return payload;
}

export async function listProjects(status: ProjectStatusFilter = "active"): Promise<ProjectRecord[]> {
  const result = (await listProjectsApi()) as ProjectListResult;

  if (result.kind === "http-error") {
    throw new ApiError("加载项目列表失败。", result.status);
  }

  const projects = result.projects.map(mapProject);
  return status === "all" ? projects : projects.filter((project) => project.status === status);
}

export async function listProjectsWithStats(
  status: ProjectStatusFilter = "active",
): Promise<ProjectSummaryRecord[]> {
  const result = await listProjectsWithStatsApi(status);
  return unwrapData(result, "加载项目统计失败。").map(mapProjectSummary);
}

export async function getProject(projectId: string): Promise<ProjectRecord> {
  const result = (await getProjectApi(projectId)) as ProjectLookupResult;

  if (result.kind === "success") {
    return mapProject(result.project);
  }

  if (result.kind === "unavailable" && result.project) {
    return mapProject(result.project);
  }

  if (result.kind === "not-found") {
    throw new ApiError("项目不存在。", 404);
  }

  if (result.kind === "http-error") {
    throw new ApiError("加载项目信息失败。", result.status);
  }

  throw new ApiError("加载项目信息失败。", 503);
}

export async function createProject(input: {
  name: string;
  code: string;
  description?: string;
}): Promise<ProjectRecord> {
  return mapProject(
    unwrapData(
      await createProjectApi({
        name: input.name,
        code: input.code,
        description: input.description ?? null,
      }),
      "创建项目失败。",
    ),
  );
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<ProjectRecord> {
  return mapProject(
    unwrapData(await updateProjectStatusApi(projectId, status), "更新项目状态失败。"),
  );
}

export async function deleteProject(projectId: string): Promise<void> {
  unwrapData(await deleteProjectApi(projectId), "删除项目失败。");
}

export async function listProjectDocuments(projectId: string): Promise<ProjectDocumentRecord[]> {
  const result = (await listProjectDocumentsApi(projectId)) as DocumentListResult;

  if (result.kind === "http-error") {
    throw new ApiError("加载项目文档失败。", result.status);
  }

  return result.documents.map(mapDocument);
}

export async function listProjectTestCaseDirectories(
  projectId: string,
): Promise<TestCaseDirectoryRecord[]> {
  return unwrapData(
    await listProjectTestCaseDirectoriesApi(projectId),
    "加载用例目录失败。",
  ).map(mapTestCaseDirectory);
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
  return mapDocument(
    unwrapData(
      await createProjectDocumentApi(projectId, {
        type: input.type,
        name: input.name,
        source_mode: input.sourceMode,
        source_uri: input.sourceUri ?? null,
      }),
      "创建项目文档失败。",
    ),
  );
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
  return mapDocument(
    unwrapData(await uploadProjectDocumentApi(projectId, input), "上传项目文档失败。"),
  );
}

export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
): Promise<void> {
  unwrapData(await deleteProjectDocumentApi(projectId, documentId), "删除项目文档失败。");
}

export async function listProjectTestCases(projectId: string): Promise<TestCaseRecord[]> {
  const result = (await listProjectTestCasesApi(projectId)) as TestCaseListResult;

  if (result.kind === "http-error") {
    throw new ApiError("加载测试用例失败。", result.status);
  }

  return result.items.map(mapTestCase);
}

export async function importTestCases(
  projectId: string,
  cases: CreateTestCaseInput[],
): Promise<TestCaseRecord[]> {
  return unwrapData(
    await importTestCasesApi(projectId, {
      cases: cases.map((testCase) => toTestCaseMutationPayload(testCase) as TestCaseMutationPayload),
    }),
    "导入测试用例失败。",
  ).map(mapTestCase);
}

export async function createTestCase(
  projectId: string,
  input: CreateTestCaseInput,
): Promise<TestCaseRecord> {
  return mapTestCase(
    unwrapData(
      await createTestCaseApi(projectId, toTestCaseMutationPayload(input) as TestCaseMutationPayload),
      "创建测试用例失败。",
    ),
  );
}

export async function getTestCase(testCaseId: string): Promise<TestCaseRecord> {
  return mapTestCase(unwrapData(await getTestCaseApi(testCaseId), "加载测试用例失败。"));
}

export async function updateTestCase(
  testCaseId: string,
  input: Partial<CreateTestCaseInput>,
): Promise<TestCaseRecord> {
  return mapTestCase(
    unwrapData(
      await updateTestCaseApi(testCaseId, toTestCaseMutationPayload(input)),
      "更新测试用例失败。",
    ),
  );
}

export async function listTestCaseReviews(testCaseId: string): Promise<ReviewRecord[]> {
  return unwrapData(await listTestCaseReviewsApi(testCaseId), "加载评审记录失败。");
}

export async function addTestCaseReview(
  testCaseId: string,
  payload: AddReviewInput,
): Promise<ReviewRecord> {
  const result = await addTestCaseReviewApi(testCaseId, {
    reviewer_id: payload.reviewerId,
    action: payload.action,
    comment: payload.comment ?? null,
  } satisfies CreateReviewPayload);

  if (result.kind !== "success") {
    return throwFromResult(result, "提交评审记录失败。");
  }

  return {
    id: String(result.data.id),
    testCaseId: String(result.data.test_case_id),
    reviewerId: result.data.reviewer_id,
    action: result.data.action,
    comment: result.data.comment,
    createdAt: result.data.created_at,
  };
}

export async function publishTestCase(testCaseId: string): Promise<TestCaseRecord> {
  return mapTestCase(unwrapData(await publishTestCaseApi(testCaseId), "发布测试用例失败。"));
}
