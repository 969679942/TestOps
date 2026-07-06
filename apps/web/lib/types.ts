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

export type RuntimeSettingsRecord = {
  cursor: {
    command: string;
    timeoutSeconds: number;
    cwd: string | null;
  };
  codex: {
    failureAnalysisModel: string;
  };
  notifications: {
    larkWebhookConfigured: boolean;
  };
  runner: {
    framework: string;
    language: string;
    pattern: string;
    reporter: string;
  };
  storage: {
    artifactRoot: string;
    documentRoot: string;
  };
};

export type RuntimeSettingsUpdateRecord = Omit<RuntimeSettingsRecord, "notifications">;

export type RuntimeSettingsResult =
  | {
      kind: "success";
      settings: RuntimeSettingsRecord;
    }
  | {
      kind: "unavailable";
      settings: RuntimeSettingsRecord;
    }
  | {
      kind: "http-error";
      status: number;
    };

export type DocumentType = LooseString<
  "prd" | "figma" | "swagger" | "business_rule" | "supplement"
>;

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

export type TestCaseDirectoryRecord = {
  id: string | number;
  projectId: string | number;
  name: string;
  parentId: string | number | null;
  children: TestCaseDirectoryRecord[];
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

export type SkillPackageRecord = {
  id: string | number;
  projectId: string | number;
  systemKey: string;
  name: string;
  status: string;
  activeVersionId: string | number | null;
  activeVersionSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SkillPackageVersionRecord = {
  id: string | number;
  skillPackageId: string | number;
  versionNo: number;
  storageUri: string | null;
  structuredMetadata: Record<string, unknown>;
  summary: string | null;
  createdAt: string;
};

export type GlobalSkillDefinitionRecord = {
  id: string | number;
  skillKey: string;
  name: string;
  description: string;
  category: string;
  domain: string;
  inputTypes: string[];
  status: string;
  owner: string;
  currentProductionVersionId: string | number | null;
  currentProductionVersionLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GlobalSkillDefinitionCreateRecord = {
  skill_key?: string;
  name?: string;
  description?: string;
  category?: string;
  domain?: string;
  input_types?: string[];
  owner?: string;
};

export type GlobalSkillDefinitionUpdateRecord = Partial<GlobalSkillDefinitionCreateRecord> & {
  status?: string;
};

export type GlobalSkillVersionRecord = {
  id: string | number;
  globalSkillId: string | number;
  versionNo: number;
  versionLabel: string;
  status: string;
  promptTemplate: string;
  scenarioTaxonomy: string[];
  reviewChecklist: string[];
  coverageDimensions: string[];
  evidencePolicy: string;
  storageUri: string | null;
  changeLog: string | null;
  releaseNotes: string | null;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
};

export type GlobalSkillVersionCreateRecord = {
  version_label: string;
  prompt_template: string;
  scenario_taxonomy: string[];
  review_checklist: string[];
  coverage_dimensions: string[];
  evidence_policy: string;
  storage_uri?: string | null;
  change_log?: string | null;
  release_notes?: string | null;
  created_by?: string;
  status?: string;
};

export type GlobalSkillVersionUpdateRecord = Partial<GlobalSkillVersionCreateRecord>;

export type GlobalSkillProjectBindingRecord = {
  bindingId: string | number;
  projectId: string | number;
  projectName: string;
  projectCode: string;
  bindingType: string;
  isDefault: boolean;
  globalSkillVersionId: string | number;
  versionLabel: string;
  versionStatus: string;
  updatedAt: string;
};

export type GlobalSkillUsageStatsRecord = {
  boundProjectCount: number;
  generationTaskCount: number;
  succeededGenerationCount: number;
  failedGenerationCount: number;
  latestGenerationAt: string | null;
  draftVersionCount: number;
  productionVersionLabel: string | null;
};

export type ProjectSkillBindingRecord = {
  id: string | number;
  projectId: string | number;
  globalSkillId: string | number;
  globalSkillVersionId: string | number;
  bindingType: string;
  status: string;
  isDefault: boolean;
  overridePayload: Record<string, unknown>;
  skillKey: string;
  skillName: string;
  versionLabel: string;
  versionStatus: string;
  skillCategory: string;
  skillDomain: string;
  inputTypes: string[];
  createdAt: string;
  updatedAt: string;
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

export type TestCaseUiContext = {
  schemaVersion: string;
  framework: string;
  baseUrl: string;
  browser: string;
  viewport: { width: number; height: number };
  entryPath: string;
  entryReadySelector: string;
  testData: Record<string, string>;
  teardown: string;
};

export type TestCaseRecord = {
  id: string | number;
  projectId: string | number;
  title: string;
  status: string;
  directoryId?: string | number | null;
  module: string;
  feature: string;
  caseType: string;
  priority: string;
  preconditions: string[];
  steps: Array<
    StructuredTextField & {
      action?: string;
      target?: string;
      locator_hint?: string;
      locatorHint?: string;
      value?: string;
      assertion?: string;
      timeout_ms?: number;
      timeoutMs?: number;
      order?: number;
    }
  >;
  expectedResults: StructuredTextField[];
  tags: string[];
  automationFlag: boolean;
  automationNotes: string | null;
  uiContext?: TestCaseUiContext | null;
  linkedRequirement?: string | null;
  sourceRefs?: Record<string, unknown>[];
  generationTaskId?: string | number | null;
  publishedAt?: string | null;
};

export type TestCaseMutationPayload = {
  title: string;
  module: string;
  feature: string;
  case_type: string;
  priority: string;
  directory_id?: string | number | null;
  preconditions: string[];
  steps: TestCaseRecord["steps"];
  expected_results: StructuredTextField[];
  tags: string[];
  automation_flag: boolean;
  automation_notes: string | null;
  ui_context?: Record<string, unknown> | null;
  linked_requirement?: string | null;
  source_refs?: Record<string, unknown>[];
  generation_task_id?: string | number | null;
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

export type AutomationScheduleRecord = {
  id: string | number;
  projectId: string | number;
  environmentId: string | number;
  name: string;
  targetGenerationIds: (string | number)[];
  cronExpression: string;
  status: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AutomationScheduleListResult =
  | {
      kind: "success";
      items: AutomationScheduleRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationScheduleRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type AutomationReportRecord = {
  id: string | number;
  automationRunId: string | number;
  kind: string;
  artifactRoot: string;
  indexPath: string;
  summary: Record<string, unknown>;
  createdAt: string;
};

export type AutomationReportListResult =
  | {
      kind: "success";
      items: AutomationReportRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationReportRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type AutomationFinalReportRecord = {
  id: string | number;
  projectId: string | number;
  automationRunId: string | number;
  status: string;
  title: string;
  summary: Record<string, unknown>;
  content: string;
  larkStatus: string;
  larkError: string | null;
  createdAt: string;
  pushedAt: string | null;
};

export type AutomationFinalReportListResult =
  | {
      kind: "success";
      items: AutomationFinalReportRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationFinalReportRecord[];
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

export type AutomationDebugProposalRecord = {
  id: string | number;
  automationFailureAnalysisId: string | number;
  status: string;
  proposalType: string;
  summary: string;
  patchProposal: Record<string, unknown>;
  recommendations: string[];
  reviewerId: string | null;
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type AutomationDebugProposalListResult =
  | {
      kind: "success";
      items: AutomationDebugProposalRecord[];
    }
  | {
      kind: "unavailable";
      items: AutomationDebugProposalRecord[];
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

export type DataSetupExecutionRecord = {
  id: string | number;
  dataSetupHintId: string | number;
  automationRunId: string | number;
  status: string;
  requestSummary: Record<string, unknown>;
  responseSummary: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type DataSetupExecutionListResult =
  | {
      kind: "success";
      executions: DataSetupExecutionRecord[];
    }
  | {
      kind: "unavailable";
      executions: DataSetupExecutionRecord[];
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
