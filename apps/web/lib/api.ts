import type {
  DocumentAsset,
  DocumentAssetListResult,
  GenerationTaskListResult,
  GenerationTaskRecord,
  ProjectLookupResult,
  ProjectListResult,
  ProjectRecord,
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

async function requestJson<T>(path: string): Promise<RequestResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
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
