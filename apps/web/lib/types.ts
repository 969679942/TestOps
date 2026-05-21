export type LooseString<T extends string> = T | (string & {});

export type ProjectRecord = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  defaultProvider: string;
  defaultPromptProfile: string;
};

export type DocumentType = LooseString<"prd" | "figma" | "swagger">;

export type EnvironmentRecord = {
  id: string | number;
  projectId: string | number;
  name: string;
  code: string;
  baseUrl: string;
  apiBaseUrl: string;
  authProfile: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentAsset = {
  id: string | number;
  projectId: string | number;
  type: DocumentType;
  name: string;
  sourceMode: string;
  sourceUri: string | null;
  parseStatus?: string;
};

export type DocumentVersionRecord = {
  id: string | number;
  documentAssetId: string | number;
  versionNo: number;
  storagePath: string | null;
  checksum: string | null;
  sourceUri: string | null;
  parseStatus: string;
  parseSummary: string | null;
  structuredMetadata: Record<string, unknown>;
};

export type GenerationTaskStatus = LooseString<
  "queued" | "running" | "succeeded" | "failed"
>;

export type GenerationTaskRecord = {
  id: string | number;
  projectId: string | number;
  status: GenerationTaskStatus;
  provider: string;
  model: string;
  promptVersion: string;
  inputRefs: Record<string, unknown>;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type StructuredTextField = {
  text: string;
};

export type TestCaseRecord = {
  id: string | number;
  projectId: string | number;
  title: string;
  status: string;
  module: string;
  feature: string;
  caseType: string;
  priority: string;
  preconditions: string[];
  steps: StructuredTextField[];
  expectedResults: StructuredTextField[];
  tags: string[];
  automationFlag: boolean;
  automationNotes: string | null;
};

export type TestCaseMutationPayload = {
  title: string;
  module: string;
  feature: string;
  case_type: string;
  priority: string;
  preconditions: string[];
  steps: StructuredTextField[];
  expected_results: StructuredTextField[];
  tags: string[];
  automation_flag: boolean;
  automation_notes: string | null;
};

export type AutomationGenerationRecord = {
  id: string | number;
  testCaseId: string | number;
  status: string;
  framework: string;
  language: string;
  pattern: string;
  artifactRoot: string | null;
  artifactPaths: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AutomationGenerationListResult =
  | {
      kind: "success";
      items: AutomationGenerationRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationGenerationRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type AutomationRunRecord = {
  id: string | number;
  automationGenerationId: string | number;
  status: string;
  triggerMode: string;
  reportPath: string | null;
  summary: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type AutomationRunListResult =
  | {
      kind: "success";
      items: AutomationRunRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationRunRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type AutomationFailureAnalysisRecord = {
  id: string | number;
  automationRunId: string | number;
  status: string;
  provider: string;
  model: string;
  classification: string;
  confidence: number;
  summary: string;
  recommendations: string[];
  shouldRerun: boolean;
  createdAt: string;
  completedAt: string | null;
};

export type AutomationFailureAnalysisListResult =
  | {
      kind: "success";
      items: AutomationFailureAnalysisRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationFailureAnalysisRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type DataSetupHintRecord = {
  id: string | number;
  testCaseId: string | number;
  documentVersionId: string | number;
  environmentId: string | number;
  endpoint: string;
  method: string;
  requestTemplate: Record<string, unknown>;
  purpose: string;
  confidenceScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DataSetupHintListResult =
  | {
      kind: "success";
      hints: DataSetupHintRecord[];
    }
  | {
      kind: "unavailable";
      hints: DataSetupHintRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type TestCaseListResult =
  | {
      kind: "success";
      items: TestCaseRecord[];
    }
  | {
      kind: "unavailable";
      items: TestCaseRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type ProjectListResult =
  | {
      kind: "success";
      projects: ProjectRecord[];
    }
  | {
      kind: "unavailable";
      projects: ProjectRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type ProjectLookupResult =
  | {
      kind: "success";
      project: ProjectRecord;
    }
  | {
      kind: "unavailable";
      project: ProjectRecord | null;
    }
  | {
      kind: "not-found";
    }
  | {
      kind: "http-error";
      status: number;
    };

export type EnvironmentListResult =
  | {
      kind: "success";
      environments: EnvironmentRecord[];
    }
  | {
      kind: "unavailable";
      environments: EnvironmentRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type DocumentAssetListResult =
  | {
      kind: "success";
      documents: DocumentAsset[];
    }
  | {
      kind: "unavailable";
      documents: DocumentAsset[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type GenerationTaskListResult =
  | {
      kind: "success";
      tasks: GenerationTaskRecord[];
    }
  | {
      kind: "unavailable";
      tasks: GenerationTaskRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };
