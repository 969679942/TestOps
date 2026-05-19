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

const demoDocuments: Record<string, ProjectDocumentRecord[]> = {
  payments: [
    {
      id: "prd-v2",
      projectId: "payments",
      type: "prd",
      name: "Payments PRD",
      sourceMode: "upload",
      sourceUri: "prd/payments-v2.pdf",
    },
    {
      id: "swagger-checkout",
      projectId: "payments",
      type: "swagger",
      name: "Checkout API Contract",
      sourceMode: "url",
      sourceUri: "https://internal.example/swagger/payments",
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
    },
    {
      id: "swagger-checkout",
      projectId: "1",
      type: "swagger",
      name: "Checkout API Contract",
      sourceMode: "url",
      sourceUri: "https://internal.example/swagger/payments",
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

function getDemoProject(projectId: string): ProjectRecord | null {
  return (
    demoProjects.find((project) => project.id === projectId || project.code === projectId) ??
    null
  );
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const result = await requestJson<ProjectApiRecord[]>("/projects");

  if (result.kind === "unavailable") {
    return demoProjects;
  }

  if (result.kind !== "success") {
    return [];
  }

  return result.data.map(mapProject);
}

export async function getProject(projectId: string): Promise<ProjectRecord | null> {
  const result = await requestJson<ProjectApiRecord>(`/projects/${projectId}`);

  if (result.kind === "unavailable") {
    return getDemoProject(projectId);
  }

  if (result.kind !== "success") {
    return null;
  }

  return mapProject(result.data);
}

export async function listProjectDocuments(
  projectId: string,
): Promise<ProjectDocumentRecord[]> {
  const result = await requestJson<ProjectDocumentApiRecord[]>(
    `/projects/${projectId}/documents`,
  );

  if (result.kind === "unavailable") {
    return demoDocuments[projectId] ?? [];
  }

  if (result.kind !== "success") {
    return [];
  }

  return result.data.map(mapDocument);
}
