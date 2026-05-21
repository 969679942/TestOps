import type {
  AutomationGenerationListResult,
  AutomationGenerationRecord,
  AutomationFailureAnalysisListResult,
  AutomationFailureAnalysisRecord,
  AutomationRunListResult,
  AutomationRunRecord,
  DocumentAsset,
  DocumentAssetListResult,
  DocumentVersionRecord,
  GenerationTaskListResult,
  GenerationTaskRecord,
  ProjectLookupResult,
  ProjectListResult,
  ProjectRecord,
  TestCaseListResult,
  TestCaseMutationPayload,
  TestCaseRecord,
} from "./types";

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
  parse_status: string;
};

type DocumentVersionApiRecord = {
  id: number;
  document_asset_id: number;
  version_no: number;
  storage_path: string | null;
  checksum: string | null;
  source_uri: string | null;
  parse_status: string;
  parse_summary: string | null;
  structured_metadata: Record<string, unknown>;
};

type GenerationTaskApiRecord = {
  id: number;
  project_id: number;
  status: string;
  provider: string;
  model: string;
  prompt_version: string;
  input_refs: Record<string, unknown>;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
};

type StructuredTextFieldApiRecord = {
  text: string;
};

type ProjectTestCaseApiRecord = {
  id: number;
  project_id: number;
  title: string;
  status: string;
  module: string;
  feature: string;
  case_type: string;
  priority: string;
  preconditions: string[];
  steps: StructuredTextFieldApiRecord[];
  expected_results: StructuredTextFieldApiRecord[];
  tags: string[];
  automation_flag: boolean;
  automation_notes: string | null;
};

type AutomationGenerationApiRecord = {
  id: number;
  test_case_id: number;
  status: string;
  framework: string;
  language: string;
  pattern: string;
  artifact_root: string | null;
  artifact_paths: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

type AutomationRunApiRecord = {
  id: number;
  automation_generation_id: number;
  status: string;
  trigger_mode: string;
  report_path: string | null;
  summary: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type AutomationFailureAnalysisApiRecord = {
  id: number;
  automation_run_id: number;
  status: string;
  provider: string;
  model: string;
  classification: string;
  confidence: number;
  summary: string;
  recommendations: string[];
  should_rerun: boolean;
  created_at: string;
  completed_at: string | null;
};

type ReviewApiRecord = {
  id: number;
  test_case_id: number;
  reviewer_id: string;
  action: string;
  comment: string | null;
  created_at: string;
};

type RequestResult<T> =
  | {
      kind: "success";
      data: T;
    }
  | {
      kind: "http-error";
      status: number;
    }
  | {
      kind: "unavailable";
    };

export type CreateProjectDocumentPayload = {
  type: string;
  name: string;
  source_mode: string;
  source_uri?: string | null;
};

export type CreateDocumentVersionPayload = {
  filename?: string | null;
  content?: string | null;
  source_uri?: string | null;
};

export type CreateGenerationTaskPayload = {
  input_document_ids: number[];
  provider?: string | null;
  model?: string | null;
  prompt_profile?: string | null;
};

export type CreateReviewPayload = {
  reviewer_id: string;
  action: "comment" | "request_change" | "approve" | "reject";
  comment?: string | null;
};

export type UpdateAutomationRunPayload = {
  status: "queued" | "running" | "passed" | "failed";
  report_path?: string | null;
  summary?: Record<string, unknown>;
  error_message?: string | null;
};

const API_BASE_URL = process.env.TESTOPS_API_BASE_URL ?? "http://127.0.0.1:8000";

const demoProjects: ProjectRecord[] = [
  {
    id: "payments",
    name: "Payments Platform",
    code: "payments",
    description: "Checkout, refunds, and settlement flows for the web storefront.",
    status: "active",
    defaultProvider: "cursor",
    defaultPromptProfile: "default",
  },
  {
    id: "account-center",
    name: "Account Center",
    code: "account-center",
    description: "Identity, profile, and access-management requirements for core users.",
    status: "active",
    defaultProvider: "openai",
    defaultPromptProfile: "review-heavy",
  },
];

const demoDocuments: Record<string, DocumentAsset[]> = {
  payments: [
    {
      id: "prd-v2",
      projectId: "payments",
      type: "prd",
      name: "Payments PRD",
      sourceMode: "upload",
      sourceUri: "prd/payments-v2.pdf",
      parseStatus: "parsed",
    },
    {
      id: "swagger-checkout",
      projectId: "payments",
      type: "swagger",
      name: "Checkout API Contract",
      sourceMode: "url",
      sourceUri: "https://internal.example/swagger/payments",
      parseStatus: "ready",
    },
  ],
  "1": [
    {
      id: "prd-v2",
      projectId: "1",
      type: "prd",
      name: "Payments PRD",
      sourceMode: "upload",
      sourceUri: "prd/payments-v2.pdf",
      parseStatus: "parsed",
    },
    {
      id: "swagger-checkout",
      projectId: "1",
      type: "swagger",
      name: "Checkout API Contract",
      sourceMode: "url",
      sourceUri: "https://internal.example/swagger/payments",
      parseStatus: "ready",
    },
  ],
  "account-center": [
    {
      id: "figma-account",
      projectId: "account-center",
      type: "figma",
      name: "Account Settings Flows",
      sourceMode: "url",
      sourceUri: "https://internal.example/figma/account-center",
      parseStatus: "parsed",
    },
  ],
  "2": [
    {
      id: "figma-account",
      projectId: "2",
      type: "figma",
      name: "Account Settings Flows",
      sourceMode: "url",
      sourceUri: "https://internal.example/figma/account-center",
      parseStatus: "parsed",
    },
  ],
};

const demoGenerationTasks: Record<string, GenerationTaskRecord[]> = {
  payments: [
    {
      id: "gen-101",
      projectId: "payments",
      status: "queued",
      provider: "cursor",
      model: "gpt-4.1-mini",
      promptVersion: "default",
      inputRefs: {
        document_ids: ["prd-v2", "swagger-checkout"],
      },
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      createdAt: "2026-05-18T09:30:00Z",
    },
    {
      id: "gen-100",
      projectId: "payments",
      status: "failed",
      provider: "openai",
      model: "gpt-4.1",
      promptVersion: "review-heavy",
      inputRefs: {
        document_ids: ["prd-v2"],
      },
      startedAt: "2026-05-17T18:00:00Z",
      finishedAt: "2026-05-17T18:02:00Z",
      errorMessage: "Generation dispatch could not reach the broker.",
      createdAt: "2026-05-17T17:59:00Z",
    },
  ],
  "1": [
    {
      id: "gen-101",
      projectId: "1",
      status: "queued",
      provider: "cursor",
      model: "gpt-4.1-mini",
      promptVersion: "default",
      inputRefs: {
        document_ids: ["prd-v2", "swagger-checkout"],
      },
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      createdAt: "2026-05-18T09:30:00Z",
    },
    {
      id: "gen-100",
      projectId: "1",
      status: "failed",
      provider: "openai",
      model: "gpt-4.1",
      promptVersion: "review-heavy",
      inputRefs: {
        document_ids: ["prd-v2"],
      },
      startedAt: "2026-05-17T18:00:00Z",
      finishedAt: "2026-05-17T18:02:00Z",
      errorMessage: "Generation dispatch could not reach the broker.",
      createdAt: "2026-05-17T17:59:00Z",
    },
  ],
  "account-center": [
    {
      id: "gen-201",
      projectId: "account-center",
      status: "succeeded",
      provider: "openai",
      model: "gpt-4.1",
      promptVersion: "review-heavy",
      inputRefs: {
        document_ids: ["figma-account"],
      },
      startedAt: "2026-05-18T11:00:00Z",
      finishedAt: "2026-05-18T11:04:00Z",
      errorMessage: null,
      createdAt: "2026-05-18T10:58:00Z",
    },
  ],
  "2": [
    {
      id: "gen-201",
      projectId: "2",
      status: "succeeded",
      provider: "openai",
      model: "gpt-4.1",
      promptVersion: "review-heavy",
      inputRefs: {
        document_ids: ["figma-account"],
      },
      startedAt: "2026-05-18T11:00:00Z",
      finishedAt: "2026-05-18T11:04:00Z",
      errorMessage: null,
      createdAt: "2026-05-18T10:58:00Z",
    },
  ],
};

const demoTestCases: Record<string, TestCaseRecord[]> = {
  payments: [
    {
      id: "case-101",
      projectId: "payments",
      title: "Create order with saved card",
      status: "draft",
      module: "Checkout",
      feature: "Card payment",
      caseType: "functional",
      priority: "high",
      preconditions: ["Saved Visa card is available on the account."],
      steps: [
        { text: "Open the checkout page for an in-stock item." },
        { text: "Select the saved card and submit the order." },
      ],
      expectedResults: [
        { text: "The order is confirmed successfully." },
        { text: "A payment authorization record is created." },
      ],
      tags: ["smoke", "payments"],
      automationFlag: true,
      automationNotes: "Reuse the seeded card fixture before checkout.",
    },
    {
      id: "case-102",
      projectId: "payments",
      title: "Decline expired card before capture",
      status: "needs_update",
      module: "Checkout",
      feature: "Card validation",
      caseType: "negative",
      priority: "medium",
      preconditions: ["Expired card test data is available."],
      steps: [
        { text: "Open the checkout page and enter the expired card details." },
        { text: "Submit the order." },
      ],
      expectedResults: [
        { text: "The order is blocked before payment capture." },
        { text: "The user sees a clear card-expired validation message." },
      ],
      tags: ["negative", "payments"],
      automationFlag: false,
      automationNotes: null,
    },
  ],
  "1": [
    {
      id: "case-101",
      projectId: "1",
      title: "Create order with saved card",
      status: "draft",
      module: "Checkout",
      feature: "Card payment",
      caseType: "functional",
      priority: "high",
      preconditions: ["Saved Visa card is available on the account."],
      steps: [
        { text: "Open the checkout page for an in-stock item." },
        { text: "Select the saved card and submit the order." },
      ],
      expectedResults: [
        { text: "The order is confirmed successfully." },
        { text: "A payment authorization record is created." },
      ],
      tags: ["smoke", "payments"],
      automationFlag: true,
      automationNotes: "Reuse the seeded card fixture before checkout.",
    },
    {
      id: "case-102",
      projectId: "1",
      title: "Decline expired card before capture",
      status: "needs_update",
      module: "Checkout",
      feature: "Card validation",
      caseType: "negative",
      priority: "medium",
      preconditions: ["Expired card test data is available."],
      steps: [
        { text: "Open the checkout page and enter the expired card details." },
        { text: "Submit the order." },
      ],
      expectedResults: [
        { text: "The order is blocked before payment capture." },
        { text: "The user sees a clear card-expired validation message." },
      ],
      tags: ["negative", "payments"],
      automationFlag: false,
      automationNotes: null,
    },
  ],
  "account-center": [
    {
      id: "case-201",
      projectId: "account-center",
      title: "Update profile email after MFA",
      status: "draft",
      module: "Profile",
      feature: "Email update",
      caseType: "functional",
      priority: "high",
      preconditions: ["User is enrolled in MFA."],
      steps: [
        { text: "Open profile settings and start an email change." },
        { text: "Complete the MFA challenge and save the new email address." },
      ],
      expectedResults: [
        { text: "The email address is updated for the active profile." },
      ],
      tags: ["account-center"],
      automationFlag: true,
      automationNotes: "Seed an MFA-enrolled profile before editing.",
    },
  ],
  "2": [
    {
      id: "case-201",
      projectId: "2",
      title: "Update profile email after MFA",
      status: "draft",
      module: "Profile",
      feature: "Email update",
      caseType: "functional",
      priority: "high",
      preconditions: ["User is enrolled in MFA."],
      steps: [
        { text: "Open profile settings and start an email change." },
        { text: "Complete the MFA challenge and save the new email address." },
      ],
      expectedResults: [
        { text: "The email address is updated for the active profile." },
      ],
      tags: ["account-center"],
      automationFlag: true,
      automationNotes: "Seed an MFA-enrolled profile before editing.",
    },
  ],
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<RequestResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      return {
        kind: "http-error",
        status: response.status,
      };
    }

    return {
      kind: "success",
      data: (await response.json()) as T,
    };
  } catch {
    return {
      kind: "unavailable",
    };
  }
}

async function postJson<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<RequestResult<T>> {
  return requestJson<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function patchJson<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<RequestResult<T>> {
  return requestJson<T>(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
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

function mapDocument(document: ProjectDocumentApiRecord): DocumentAsset {
  return {
    id: String(document.id),
    projectId: String(document.project_id),
    type: document.type,
    name: document.name,
    sourceMode: document.source_mode,
    sourceUri: document.source_uri,
    parseStatus: document.parse_status,
  };
}

function mapDocumentVersion(version: DocumentVersionApiRecord): DocumentVersionRecord {
  return {
    id: String(version.id),
    documentAssetId: String(version.document_asset_id),
    versionNo: version.version_no,
    storagePath: version.storage_path,
    checksum: version.checksum,
    sourceUri: version.source_uri,
    parseStatus: version.parse_status,
    parseSummary: version.parse_summary,
    structuredMetadata: version.structured_metadata,
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
    inputRefs: task.input_refs,
    startedAt: task.started_at,
    finishedAt: task.finished_at,
    errorMessage: task.error_message,
    createdAt: task.created_at,
  };
}

function mapTestCase(item: ProjectTestCaseApiRecord): TestCaseRecord {
  return {
    id: String(item.id),
    projectId: String(item.project_id),
    title: item.title,
    status: item.status,
    module: item.module,
    feature: item.feature,
    caseType: item.case_type,
    priority: item.priority,
    preconditions: item.preconditions,
    steps: item.steps,
    expectedResults: item.expected_results,
    tags: item.tags,
    automationFlag: item.automation_flag,
    automationNotes: item.automation_notes,
  };
}

function mapAutomationGeneration(
  item: AutomationGenerationApiRecord,
): AutomationGenerationRecord {
  return {
    id: String(item.id),
    testCaseId: String(item.test_case_id),
    status: item.status,
    framework: item.framework,
    language: item.language,
    pattern: item.pattern,
    artifactRoot: item.artifact_root,
    artifactPaths: item.artifact_paths,
    errorMessage: item.error_message,
    createdAt: item.created_at,
    completedAt: item.completed_at,
  };
}

function mapAutomationRun(item: AutomationRunApiRecord): AutomationRunRecord {
  return {
    id: String(item.id),
    automationGenerationId: String(item.automation_generation_id),
    status: item.status,
    triggerMode: item.trigger_mode,
    reportPath: item.report_path,
    summary: item.summary,
    errorMessage: item.error_message,
    createdAt: item.created_at,
    startedAt: item.started_at,
    finishedAt: item.finished_at,
  };
}

function mapAutomationFailureAnalysis(
  item: AutomationFailureAnalysisApiRecord,
): AutomationFailureAnalysisRecord {
  return {
    id: String(item.id),
    automationRunId: String(item.automation_run_id),
    status: item.status,
    provider: item.provider,
    model: item.model,
    classification: item.classification,
    confidence: item.confidence,
    summary: item.summary,
    recommendations: item.recommendations,
    shouldRerun: item.should_rerun,
    createdAt: item.created_at,
    completedAt: item.completed_at,
  };
}

function getDemoProject(projectId: string): ProjectRecord | null {
  return (
    demoProjects.find((project) => project.id === projectId || project.code === projectId) ??
    null
  );
}

export async function listProjects(): Promise<ProjectListResult> {
  const result = await requestJson<ProjectApiRecord[]>("/projects");

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      projects: demoProjects,
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    projects: result.data.map(mapProject),
  };
}

export async function getProject(projectId: string): Promise<ProjectLookupResult> {
  const result = await requestJson<ProjectApiRecord>(`/projects/${projectId}`);

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      project: getDemoProject(projectId),
    };
  }

  if (result.kind === "http-error") {
    if (result.status === 404) {
      return {
        kind: "not-found",
      };
    }

    return result;
  }

  return {
    kind: "success",
    project: mapProject(result.data),
  };
}

export async function listProjectDocuments(projectId: string): Promise<DocumentAssetListResult> {
  const result = await requestJson<ProjectDocumentApiRecord[]>(
    `/projects/${projectId}/documents`,
  );

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      documents: demoDocuments[projectId] ?? [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    documents: result.data.map(mapDocument),
  };
}

export async function createProjectDocument(
  projectId: string,
  payload: CreateProjectDocumentPayload,
): Promise<RequestResult<DocumentAsset>> {
  const result = await postJson<ProjectDocumentApiRecord>(
    `/projects/${projectId}/documents`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapDocument(result.data),
  };
}

export async function createDocumentVersion(
  documentId: string,
  payload: CreateDocumentVersionPayload,
): Promise<RequestResult<DocumentVersionRecord>> {
  const result = await postJson<DocumentVersionApiRecord>(
    `/documents/${documentId}/versions`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapDocumentVersion(result.data),
  };
}

export async function parseDocumentVersion(
  versionId: string,
): Promise<RequestResult<DocumentVersionRecord>> {
  const result = await postJson<DocumentVersionApiRecord>(
    `/document-versions/${versionId}/parse`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapDocumentVersion(result.data),
  };
}

export async function listProjectGenerationTasks(
  projectId: string,
): Promise<GenerationTaskListResult> {
  const result = await requestJson<GenerationTaskApiRecord[]>(
    `/projects/${projectId}/generation-tasks`,
  );

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      tasks: demoGenerationTasks[projectId] ?? [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    tasks: result.data.map(mapGenerationTask),
  };
}

export async function createGenerationTask(
  projectId: string,
  payload: CreateGenerationTaskPayload,
): Promise<RequestResult<GenerationTaskRecord>> {
  const result = await postJson<GenerationTaskApiRecord>(
    `/projects/${projectId}/generation-tasks`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGenerationTask(result.data),
  };
}

export async function listProjectTestCases(projectId: string): Promise<TestCaseListResult> {
  const result = await requestJson<ProjectTestCaseApiRecord[]>(`/projects/${projectId}/test-cases`);

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      items: demoTestCases[projectId] ?? [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    items: result.data.map(mapTestCase),
  };
}

export async function listProjectPublishedTestCases(
  projectId: string,
): Promise<TestCaseListResult> {
  const result = await requestJson<ProjectTestCaseApiRecord[]>(
    `/projects/${projectId}/published-test-cases`,
  );

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      items: [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    items: result.data.map(mapTestCase),
  };
}

export async function listProjectAutomationGenerations(
  projectId: string,
): Promise<AutomationGenerationListResult> {
  const result = await requestJson<AutomationGenerationApiRecord[]>(
    `/projects/${projectId}/automation-generations`,
  );

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      items: [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    items: result.data.map(mapAutomationGeneration),
  };
}

export async function listProjectAutomationRuns(
  projectId: string,
): Promise<AutomationRunListResult> {
  const result = await requestJson<AutomationRunApiRecord[]>(
    `/projects/${projectId}/automation-runs`,
  );

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      items: [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    items: result.data.map(mapAutomationRun),
  };
}

export async function listProjectAutomationFailureAnalyses(
  projectId: string,
): Promise<AutomationFailureAnalysisListResult> {
  const result = await requestJson<AutomationFailureAnalysisApiRecord[]>(
    `/projects/${projectId}/automation-failure-analyses`,
  );

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      items: [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    items: result.data.map(mapAutomationFailureAnalysis),
  };
}

export async function createAutomationGeneration(
  testCaseId: string,
): Promise<RequestResult<AutomationGenerationRecord>> {
  const result = await postJson<AutomationGenerationApiRecord>(
    `/test-cases/${testCaseId}/automation-generations`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationGeneration(result.data),
  };
}

export async function createAutomationFailureAnalysis(
  runId: string,
): Promise<RequestResult<AutomationFailureAnalysisRecord>> {
  const result = await postJson<AutomationFailureAnalysisApiRecord>(
    `/automation-runs/${runId}/failure-analyses`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationFailureAnalysis(result.data),
  };
}

export async function createAutomationRun(
  generationId: string,
): Promise<RequestResult<AutomationRunRecord>> {
  const result = await postJson<AutomationRunApiRecord>(
    `/automation-generations/${generationId}/runs`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationRun(result.data),
  };
}

export async function updateAutomationRun(
  runId: string,
  payload: UpdateAutomationRunPayload,
): Promise<RequestResult<AutomationRunRecord>> {
  const result = await patchJson<AutomationRunApiRecord>(
    `/automation-runs/${runId}`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationRun(result.data),
  };
}

export async function updateTestCase(
  testCaseId: string,
  payload: TestCaseMutationPayload,
): Promise<RequestResult<TestCaseRecord>> {
  const result = await patchJson<ProjectTestCaseApiRecord>(
    `/test-cases/${testCaseId}`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapTestCase(result.data),
  };
}

export async function addTestCaseReview(
  testCaseId: string,
  payload: CreateReviewPayload,
): Promise<RequestResult<ReviewApiRecord>> {
  return postJson<ReviewApiRecord>(`/test-cases/${testCaseId}/reviews`, payload);
}

export async function publishTestCase(
  testCaseId: string,
): Promise<RequestResult<TestCaseRecord>> {
  const result = await postJson<ProjectTestCaseApiRecord>(
    `/test-cases/${testCaseId}/publish`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapTestCase(result.data),
  };
}
