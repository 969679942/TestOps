import type {
  AutomationGenerationListResult,
  AutomationGenerationRecord,
  AutomationDebugProposalListResult,
  AutomationDebugProposalRecord,
  AutomationFinalReportListResult,
  AutomationFinalReportRecord,
  AutomationFailureAnalysisListResult,
  AutomationFailureAnalysisRecord,
  AutomationReportListResult,
  AutomationReportRecord,
  AutomationRunListResult,
  AutomationRunRecord,
  AutomationScheduleListResult,
  AutomationScheduleRecord,
  DataSetupExecutionListResult,
  DataSetupExecutionRecord,
  DataSetupHintListResult,
  DataSetupHintRecord,
  DocumentAsset,
  DocumentAssetListResult,
  DocumentVersionRecord,
  EnvironmentListResult,
  EnvironmentRecord,
  GenerationTaskListResult,
  GenerationTaskRecord,
  GlobalSkillDefinitionRecord,
  GlobalSkillDefinitionCreateRecord,
  GlobalSkillDefinitionUpdateRecord,
  GlobalSkillVersionRecord,
  GlobalSkillVersionCreateRecord,
  GlobalSkillVersionUpdateRecord,
  GlobalSkillProjectBindingRecord,
  GlobalSkillUsageStatsRecord,
  ProjectSkillBindingRecord,
  ProjectLookupResult,
  ProjectListResult,
  ProjectRecord,
  RuntimeSettingsRecord,
  RuntimeSettingsResult,
  RuntimeSettingsUpdateRecord,
  SkillPackageRecord,
  SkillPackageVersionRecord,
  TestCaseDirectoryRecord,
  TestCaseListResult,
  TestCaseMutationPayload,
  TestCaseRecord,
} from "./types";

import { parseApiErrorMessage } from "./api-errors";

type ProjectApiRecord = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  default_provider: string;
  default_prompt_profile: string;
};

type RuntimeSettingsApiRecord = {
  cursor?: {
    command: string;
    timeout_seconds: number;
    cwd: string | null;
  };
  codex?: {
    failure_analysis_model: string;
  };
  notifications?: {
    lark_webhook_configured: boolean;
  };
  runner?: {
    framework: string;
    language: string;
    pattern: string;
    reporter: string;
  };
  storage?: {
    artifact_root: string;
    document_root: string;
  };
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

type TestCaseDirectoryApiRecord = {
  id: number;
  project_id: number;
  name: string;
  parent_id: number | null;
  children: TestCaseDirectoryApiRecord[];
};

type EnvironmentApiRecord = {
  id: number;
  project_id: number;
  name: string;
  code: string;
  base_url: string;
  api_base_url: string;
  auth_profile: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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

type SkillPackageApiRecord = {
  id: number;
  project_id: number;
  system_key: string;
  name: string;
  status: string;
  active_version_id: number | null;
  active_version_summary: string | null;
  created_at: string;
  updated_at: string;
};

type SkillPackageVersionApiRecord = {
  id: number;
  skill_package_id: number;
  version_no: number;
  storage_uri: string | null;
  structured_metadata: Record<string, unknown>;
  summary: string | null;
  created_at: string;
};

type GlobalSkillDefinitionApiRecord = {
  id: number;
  skill_key: string;
  name: string;
  description: string;
  category: string;
  domain: string;
  input_types: string[];
  status: string;
  owner: string;
  current_production_version_id: number | null;
  current_production_version_label: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalSkillVersionApiRecord = {
  id: number;
  global_skill_id: number;
  version_no: number;
  version_label: string;
  status: string;
  prompt_template: string;
  scenario_taxonomy: string[];
  review_checklist: string[];
  coverage_dimensions: string[];
  evidence_policy: string;
  storage_uri: string | null;
  change_log: string | null;
  release_notes: string | null;
  created_by: string;
  created_at: string;
  published_at: string | null;
};

type GlobalSkillProjectBindingApiRecord = {
  binding_id: number;
  project_id: number;
  project_name: string;
  project_code: string;
  binding_type: string;
  is_default: boolean;
  global_skill_version_id: number;
  version_label: string;
  version_status: string;
  updated_at: string;
};

type GlobalSkillUsageStatsApiRecord = {
  bound_project_count: number;
  generation_task_count: number;
  succeeded_generation_count: number;
  failed_generation_count: number;
  latest_generation_at: string | null;
  draft_version_count: number;
  production_version_label: string | null;
};

type ProjectSkillBindingApiRecord = {
  id: number;
  project_id: number;
  global_skill_id: number;
  global_skill_version_id: number;
  binding_type: string;
  status: string;
  is_default: boolean;
  override_payload: Record<string, unknown>;
  skill_key: string;
  skill_name: string;
  version_label: string;
  version_status: string;
  skill_category: string;
  skill_domain: string;
  input_types: string[];
  created_at: string;
  updated_at: string;
};

type StructuredTextFieldApiRecord = {
  text: string;
};

type ProjectTestCaseApiRecord = {
  id: number;
  project_id: number;
  directory_id: number | null;
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
  ui_context: Record<string, unknown> | null;
  linked_requirement?: string | null;
  source_refs?: Array<Record<string, unknown>>;
  generation_task_id?: number | null;
  published_at: string | null;
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

type AutomationScheduleApiRecord = {
  id: number;
  project_id: number;
  environment_id: number;
  name: string;
  target_generation_ids: number[];
  cron_expression: string;
  status: string;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
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

type AutomationDebugProposalApiRecord = {
  id: number;
  automation_failure_analysis_id: number;
  status: string;
  proposal_type: string;
  summary: string;
  patch_proposal: Record<string, unknown>;
  recommendations: string[];
  reviewer_id: string | null;
  review_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type AutomationReportApiRecord = {
  id: number;
  automation_run_id: number;
  kind: string;
  artifact_root: string;
  index_path: string;
  summary: Record<string, unknown>;
  created_at: string;
};

type AutomationFinalReportApiRecord = {
  id: number;
  project_id: number;
  automation_run_id: number;
  status: string;
  title: string;
  summary: Record<string, unknown>;
  content: string;
  lark_status: string;
  lark_error: string | null;
  created_at: string;
  pushed_at: string | null;
};

type DataSetupHintApiRecord = {
  id: number;
  test_case_id: number;
  document_version_id: number;
  environment_id: number;
  endpoint: string;
  method: string;
  request_template: Record<string, unknown>;
  purpose: string;
  confidence_score: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type DataSetupExecutionApiRecord = {
  id: number;
  data_setup_hint_id: number;
  automation_run_id: number;
  status: string;
  request_summary: Record<string, unknown>;
  response_summary: Record<string, unknown>;
  error_message: string | null;
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

type ProjectSummaryApiRecord = ProjectApiRecord & {
  document_count: number;
  test_case_count: number;
  published_count: number;
};

type RequestResult<T> =
  | {
      kind: "success";
      data: T;
    }
  | {
      kind: "http-error";
      status: number;
      message?: string;
    }
  | {
      kind: "unavailable";
    };

function getApiBaseUrl() {
  if (process.env.TESTOPS_API_BASE_URL) {
    return process.env.TESTOPS_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_TESTOPS_API_BASE_URL ?? "/api";
  }

  return "http://127.0.0.1:8000";
}

export type CreateProjectDocumentPayload = {
  type: string;
  name: string;
  source_mode: string;
  source_uri?: string | null;
};

export type CreateProjectEnvironmentPayload = {
  name: string;
  code: string;
  base_url: string;
  api_base_url: string;
  auth_profile?: string | null;
};

export type UpdateProjectEnvironmentPayload = {
  name?: string;
  base_url?: string;
  api_base_url?: string;
  auth_profile?: string | null;
  status?: "active" | "paused" | "archived";
};

export type CreateDocumentVersionPayload = {
  filename?: string | null;
  content?: string | null;
  source_uri?: string | null;
};

export type CreateGenerationTaskPayload = {
  input_document_version_ids: number[];
  input_skill_version_id?: number | null;
  input_skill_binding_id?: number | null;
  seed_test_case_ids?: number[];
  coverage_gap_note?: string | null;
  provider?: string | null;
  model?: string | null;
  prompt_profile?: string | null;
};

export type CreateSkillPackagePayload = {
  system_key: string;
  name: string;
};

export type CreateSkillPackageVersionPayload = {
  summary?: string | null;
  storage_uri?: string | null;
  template_key?: string | null;
  content: Record<string, unknown>;
};

export type CreateProjectSkillBindingPayload = {
  global_skill_id: number;
  global_skill_version_id?: number | null;
  binding_type?: string;
  is_default?: boolean;
  override_payload?: Record<string, unknown>;
};

export type UpdateProjectSkillBindingPayload = {
  global_skill_version_id?: number | null;
  binding_type?: string;
  is_default?: boolean;
  status?: string;
  override_payload?: Record<string, unknown>;
};

export type ProjectStatus = "active" | "archived";
export type ProjectStatusFilter = ProjectStatus | "all";

export type ProjectSummaryRecord = ProjectRecord & {
  documentCount: number;
  testCaseCount: number;
  publishedCount: number;
};

export type ReviewRecord = {
  id: string;
  testCaseId: string;
  reviewerId: string;
  action: string;
  comment: string | null;
  createdAt: string;
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

export type ReviewAutomationDebugProposalPayload = {
  action: "approve" | "reject";
  reviewer_id: string;
  comment?: string | null;
};

const demoProjectApiIdAliases: Record<string, string> = {
  payments: "1",
  "account-center": "2",
};

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

const demoRuntimeSettings: RuntimeSettingsRecord = {
  cursor: {
    command: "cursor-agent",
    timeoutSeconds: 120,
    cwd: null,
  },
  codex: {
    failureAnalysisModel: "codex-provider-boundary",
  },
  notifications: {
    larkWebhookConfigured: false,
  },
  runner: {
    framework: "playwright",
    language: "typescript",
    pattern: "pom",
    reporter: "allure-playwright",
  },
  storage: {
    artifactRoot: "var/artifacts",
    documentRoot: "data/documents",
  },
};

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

const demoEnvironments: Record<string, EnvironmentRecord[]> = {
  payments: [
    {
      id: "env-staging",
      projectId: "payments",
      name: "Payments Staging",
      code: "staging",
      baseUrl: "https://staging.payments.example",
      apiBaseUrl: "https://api-staging.payments.example",
      authProfile: "qa-staging",
      status: "active",
      createdAt: "2026-05-21T09:00:00Z",
      updatedAt: "2026-05-21T09:00:00Z",
    },
  ],
  "1": [
    {
      id: "env-staging",
      projectId: "1",
      name: "Payments Staging",
      code: "staging",
      baseUrl: "https://staging.payments.example",
      apiBaseUrl: "https://api-staging.payments.example",
      authProfile: "qa-staging",
      status: "active",
      createdAt: "2026-05-21T09:00:00Z",
      updatedAt: "2026-05-21T09:00:00Z",
    },
  ],
  "account-center": [
    {
      id: "env-qa",
      projectId: "account-center",
      name: "Account Center QA",
      code: "qa",
      baseUrl: "https://qa.account.example",
      apiBaseUrl: "https://api-qa.account.example",
      authProfile: "qa-account",
      status: "active",
      createdAt: "2026-05-21T09:00:00Z",
      updatedAt: "2026-05-21T09:00:00Z",
    },
  ],
  "2": [
    {
      id: "env-qa",
      projectId: "2",
      name: "Account Center QA",
      code: "qa",
      baseUrl: "https://qa.account.example",
      apiBaseUrl: "https://api-qa.account.example",
      authProfile: "qa-account",
      status: "active",
      createdAt: "2026-05-21T09:00:00Z",
      updatedAt: "2026-05-21T09:00:00Z",
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

const demoDataSetupHints: Record<string, DataSetupHintRecord[]> = {
  payments: [
    {
      id: "hint-checkout-order",
      testCaseId: "case-101",
      documentVersionId: "swagger-checkout-v1",
      environmentId: "env-staging",
      endpoint: "/orders",
      method: "post",
      requestTemplate: {
        customer_id: "{{customer_id}}",
        payment_method_id: "{{saved_card_id}}",
      },
      purpose: "Create order data",
      confidenceScore: 0.86,
      status: "ready",
      createdAt: "2026-05-21T10:00:00Z",
      updatedAt: "2026-05-21T10:00:00Z",
    },
  ],
  "1": [
    {
      id: "hint-checkout-order",
      testCaseId: "case-101",
      documentVersionId: "swagger-checkout-v1",
      environmentId: "env-staging",
      endpoint: "/orders",
      method: "post",
      requestTemplate: {
        customer_id: "{{customer_id}}",
        payment_method_id: "{{saved_card_id}}",
      },
      purpose: "Create order data",
      confidenceScore: 0.86,
      status: "ready",
      createdAt: "2026-05-21T10:00:00Z",
      updatedAt: "2026-05-21T10:00:00Z",
    },
  ],
};

const demoDataSetupExecutions: Record<string, DataSetupExecutionRecord[]> = {
  payments: [],
  "1": [],
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<RequestResult<T>> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message: string | undefined;
      try {
        message = parseApiErrorMessage(await response.json());
      } catch {
        message = undefined;
      }

      return {
        kind: "http-error",
        status: response.status,
        message,
      };
    }

    if (response.status === 204) {
      return {
        kind: "success",
        data: undefined as T,
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

async function putJson<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<RequestResult<T>> {
  return requestJson<T>(path, {
    method: "PUT",
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

function mapProjectSummary(project: ProjectSummaryApiRecord): ProjectSummaryRecord {
  return {
    ...mapProject(project),
    documentCount: project.document_count,
    testCaseCount: project.test_case_count,
    publishedCount: project.published_count,
  };
}

function mapRuntimeSettings(settings: RuntimeSettingsApiRecord): RuntimeSettingsRecord {
  const cursor = settings.cursor ?? {
    command: demoRuntimeSettings.cursor.command,
    timeout_seconds: demoRuntimeSettings.cursor.timeoutSeconds,
    cwd: demoRuntimeSettings.cursor.cwd,
  };
  const codex = settings.codex ?? {
    failure_analysis_model: demoRuntimeSettings.codex.failureAnalysisModel,
  };
  const notifications = settings.notifications ?? {
    lark_webhook_configured: demoRuntimeSettings.notifications.larkWebhookConfigured,
  };
  const runner = settings.runner ?? {
    framework: demoRuntimeSettings.runner.framework,
    language: demoRuntimeSettings.runner.language,
    pattern: demoRuntimeSettings.runner.pattern,
    reporter: demoRuntimeSettings.runner.reporter,
  };
  const storage = settings.storage ?? {
    artifact_root: demoRuntimeSettings.storage.artifactRoot,
    document_root: demoRuntimeSettings.storage.documentRoot,
  };

  return {
    cursor: {
      command: cursor.command,
      timeoutSeconds: cursor.timeout_seconds,
      cwd: cursor.cwd,
    },
    codex: {
      failureAnalysisModel: codex.failure_analysis_model,
    },
    notifications: {
      larkWebhookConfigured: notifications.lark_webhook_configured,
    },
    runner: {
      framework: runner.framework,
      language: runner.language,
      pattern: runner.pattern,
      reporter: runner.reporter,
    },
    storage: {
      artifactRoot: storage.artifact_root,
      documentRoot: storage.document_root,
    },
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

function mapTestCaseDirectory(directory: TestCaseDirectoryApiRecord): TestCaseDirectoryRecord {
  return {
    id: String(directory.id),
    projectId: String(directory.project_id),
    name: directory.name,
    parentId:
      directory.parent_id === null || directory.parent_id === undefined
        ? null
        : String(directory.parent_id),
    children: directory.children.map(mapTestCaseDirectory),
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

function mapEnvironment(environment: EnvironmentApiRecord): EnvironmentRecord {
  return {
    id: String(environment.id),
    projectId: String(environment.project_id),
    name: environment.name,
    code: environment.code,
    baseUrl: environment.base_url,
    apiBaseUrl: environment.api_base_url,
    authProfile: environment.auth_profile,
    status: environment.status,
    createdAt: environment.created_at,
    updatedAt: environment.updated_at,
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

function mapSkillPackage(item: SkillPackageApiRecord): SkillPackageRecord {
  return {
    id: String(item.id),
    projectId: String(item.project_id),
    systemKey: item.system_key,
    name: item.name,
    status: item.status,
    activeVersionId:
      item.active_version_id === null || item.active_version_id === undefined
        ? null
        : String(item.active_version_id),
    activeVersionSummary: item.active_version_summary,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapSkillPackageVersion(
  item: SkillPackageVersionApiRecord,
): SkillPackageVersionRecord {
  return {
    id: String(item.id),
    skillPackageId: String(item.skill_package_id),
    versionNo: item.version_no,
    storageUri: item.storage_uri,
    structuredMetadata: item.structured_metadata,
    summary: item.summary,
    createdAt: item.created_at,
  };
}

function mapGlobalSkillDefinition(
  item: GlobalSkillDefinitionApiRecord,
): GlobalSkillDefinitionRecord {
  return {
    id: String(item.id),
    skillKey: item.skill_key,
    name: item.name,
    description: item.description,
    category: item.category,
    domain: item.domain,
    inputTypes: item.input_types,
    status: item.status,
    owner: item.owner,
    currentProductionVersionId:
      item.current_production_version_id === null ||
      item.current_production_version_id === undefined
        ? null
        : String(item.current_production_version_id),
    currentProductionVersionLabel: item.current_production_version_label,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapGlobalSkillVersion(
  item: GlobalSkillVersionApiRecord,
): GlobalSkillVersionRecord {
  return {
    id: String(item.id),
    globalSkillId: String(item.global_skill_id),
    versionNo: item.version_no,
    versionLabel: item.version_label,
    status: item.status,
    promptTemplate: item.prompt_template,
    scenarioTaxonomy: item.scenario_taxonomy,
    reviewChecklist: item.review_checklist,
    coverageDimensions: item.coverage_dimensions,
    evidencePolicy: item.evidence_policy,
    storageUri: item.storage_uri,
    changeLog: item.change_log,
    releaseNotes: item.release_notes,
    createdBy: item.created_by,
    createdAt: item.created_at,
    publishedAt: item.published_at,
  };
}

function mapGlobalSkillProjectBinding(
  item: GlobalSkillProjectBindingApiRecord,
): GlobalSkillProjectBindingRecord {
  return {
    bindingId: String(item.binding_id),
    projectId: String(item.project_id),
    projectName: item.project_name,
    projectCode: item.project_code,
    bindingType: item.binding_type,
    isDefault: item.is_default,
    globalSkillVersionId: String(item.global_skill_version_id),
    versionLabel: item.version_label,
    versionStatus: item.version_status,
    updatedAt: item.updated_at,
  };
}

function mapGlobalSkillUsageStats(
  item: GlobalSkillUsageStatsApiRecord,
): GlobalSkillUsageStatsRecord {
  return {
    boundProjectCount: item.bound_project_count,
    generationTaskCount: item.generation_task_count,
    succeededGenerationCount: item.succeeded_generation_count,
    failedGenerationCount: item.failed_generation_count,
    latestGenerationAt: item.latest_generation_at,
    draftVersionCount: item.draft_version_count,
    productionVersionLabel: item.production_version_label,
  };
}

function mapProjectSkillBinding(
  item: ProjectSkillBindingApiRecord,
): ProjectSkillBindingRecord {
  return {
    id: String(item.id),
    projectId: String(item.project_id),
    globalSkillId: String(item.global_skill_id),
    globalSkillVersionId: String(item.global_skill_version_id),
    bindingType: item.binding_type,
    status: item.status,
    isDefault: item.is_default,
    overridePayload: item.override_payload,
    skillKey: item.skill_key,
    skillName: item.skill_name,
    versionLabel: item.version_label,
    versionStatus: item.version_status,
    skillCategory: item.skill_category,
    skillDomain: item.skill_domain,
    inputTypes: item.input_types,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
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
    directoryId:
      item.directory_id === null || item.directory_id === undefined
        ? null
        : String(item.directory_id),
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
    uiContext: mapUiContext(item.ui_context),
    linkedRequirement: item.linked_requirement ?? null,
    sourceRefs: item.source_refs ?? [],
    generationTaskId:
      item.generation_task_id === null || item.generation_task_id === undefined
        ? null
        : String(item.generation_task_id),
    publishedAt: item.published_at ?? null,
  };
}

function mapReview(item: ReviewApiRecord): ReviewRecord {
  return {
    id: String(item.id),
    testCaseId: String(item.test_case_id),
    reviewerId: item.reviewer_id,
    action: item.action,
    comment: item.comment,
    createdAt: item.created_at,
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

function mapAutomationSchedule(item: AutomationScheduleApiRecord): AutomationScheduleRecord {
  return {
    id: String(item.id),
    projectId: String(item.project_id),
    environmentId: String(item.environment_id),
    name: item.name,
    targetGenerationIds: item.target_generation_ids.map((id) => String(id)),
    cronExpression: item.cron_expression,
    status: item.status,
    nextRunAt: item.next_run_at,
    lastRunAt: item.last_run_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
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

function mapAutomationDebugProposal(
  item: AutomationDebugProposalApiRecord,
): AutomationDebugProposalRecord {
  return {
    id: String(item.id),
    automationFailureAnalysisId: String(item.automation_failure_analysis_id),
    status: item.status,
    proposalType: item.proposal_type,
    summary: item.summary,
    patchProposal: item.patch_proposal,
    recommendations: item.recommendations,
    reviewerId: item.reviewer_id,
    reviewComment: item.review_comment,
    createdAt: item.created_at,
    reviewedAt: item.reviewed_at,
  };
}

function mapAutomationReport(item: AutomationReportApiRecord): AutomationReportRecord {
  return {
    id: String(item.id),
    automationRunId: String(item.automation_run_id),
    kind: item.kind,
    artifactRoot: item.artifact_root,
    indexPath: item.index_path,
    summary: item.summary,
    createdAt: item.created_at,
  };
}

function mapAutomationFinalReport(
  item: AutomationFinalReportApiRecord,
): AutomationFinalReportRecord {
  return {
    id: String(item.id),
    projectId: String(item.project_id),
    automationRunId: String(item.automation_run_id),
    status: item.status,
    title: item.title,
    summary: item.summary,
    content: item.content,
    larkStatus: item.lark_status,
    larkError: item.lark_error,
    createdAt: item.created_at,
    pushedAt: item.pushed_at,
  };
}

function mapDataSetupHint(item: DataSetupHintApiRecord): DataSetupHintRecord {
  return {
    id: String(item.id),
    testCaseId: String(item.test_case_id),
    documentVersionId: String(item.document_version_id),
    environmentId: String(item.environment_id),
    endpoint: item.endpoint,
    method: item.method,
    requestTemplate: item.request_template,
    purpose: item.purpose,
    confidenceScore: item.confidence_score,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapDataSetupExecution(
  item: DataSetupExecutionApiRecord,
): DataSetupExecutionRecord {
  return {
    id: String(item.id),
    dataSetupHintId: String(item.data_setup_hint_id),
    automationRunId: String(item.automation_run_id),
    status: item.status,
    requestSummary: item.request_summary,
    responseSummary: item.response_summary,
    errorMessage: item.error_message,
    createdAt: item.created_at,
    completedAt: item.completed_at,
  };
}

function getDemoProject(projectId: string): ProjectRecord | null {
  const aliasProjectId = demoProjectApiIdAliases[projectId];
  return (
    demoProjects.find(
      (project) =>
        project.id === projectId ||
        project.code === projectId ||
        project.id === aliasProjectId ||
        demoProjectApiIdAliases[project.id] === projectId,
    ) ??
    null
  );
}

function resolveProjectApiId(projectId: string): string {
  return demoProjectApiIdAliases[projectId] ?? projectId;
}

function projectPath(projectId: string, suffix = ""): string {
  return `/projects/${resolveProjectApiId(projectId)}${suffix}`;
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

async function enrichProjectsWithStats(
  projects: ProjectRecord[],
): Promise<ProjectSummaryRecord[]> {
  return Promise.all(
    projects.map(async (project) => {
      const [documentResult, testCaseResult] = await Promise.all([
        listProjectDocuments(project.id),
        listProjectTestCases(project.id),
      ]);
      const documents =
        documentResult.kind === "success" || documentResult.kind === "unavailable"
          ? documentResult.documents
          : [];
      const testCases =
        testCaseResult.kind === "success" || testCaseResult.kind === "unavailable"
          ? testCaseResult.items
          : [];

      return {
        ...project,
        documentCount: documents.length,
        testCaseCount: testCases.length,
        publishedCount: testCases.filter((item) => item.status === "published").length,
      };
    }),
  );
}

export async function listProjectsWithStats(
  status: ProjectStatusFilter = "active",
): Promise<RequestResult<ProjectSummaryRecord[]>> {
  const result = await requestJson<ProjectSummaryApiRecord[]>(
    `/project-summaries?status=${status}`,
  );

  if (result.kind === "success") {
    return {
      kind: "success",
      data: result.data.map(mapProjectSummary),
    };
  }

  if (result.kind === "unavailable") {
    return {
      kind: "success",
      data: await enrichProjectsWithStats(demoProjects),
    };
  }

  if (result.status === 404 || result.status === 422) {
    const projectResult = await listProjects();
    if (projectResult.kind === "http-error") {
      return projectResult;
    }

    return {
      kind: projectResult.kind,
      data: await enrichProjectsWithStats(projectResult.projects),
    };
  }

  return result;
}

export async function createProject(
  payload: Pick<ProjectRecord, "name" | "code" | "description">,
): Promise<RequestResult<ProjectRecord>> {
  const result = await postJson<ProjectApiRecord>("/projects", {
    name: payload.name,
    code: payload.code,
    description: payload.description ?? null,
  });

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapProject(result.data),
  };
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<RequestResult<ProjectRecord>> {
  const result = await patchJson<ProjectApiRecord>(projectPath(projectId, "/status"), {
    status,
  });

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapProject(result.data),
  };
}

export async function deleteProject(projectId: string): Promise<RequestResult<null>> {
  const result = await requestJson<null>(projectPath(projectId), {
    method: "DELETE",
  });

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: null,
  };
}

export async function getProject(projectId: string): Promise<ProjectLookupResult> {
  const result = await requestJson<ProjectApiRecord>(projectPath(projectId));

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

type ProjectWorkspaceApiRecord = {
  project: ProjectSummaryApiRecord;
  documents: ProjectDocumentApiRecord[];
};

export type ProjectWorkspacePayload = {
  project: ProjectSummaryRecord;
  documents: DocumentAsset[];
};

export async function getProjectWorkspace(
  projectId: string,
): Promise<
  | { kind: "success"; data: ProjectWorkspacePayload }
  | { kind: "not-found" }
  | { kind: "http-error"; status: number; message?: string }
  | { kind: "unavailable" }
> {
  const result = await requestJson<ProjectWorkspaceApiRecord>(projectPath(projectId, "/workspace"));

  if (result.kind === "unavailable") {
    const project = getDemoProject(projectId);
    if (!project) {
      return { kind: "not-found" };
    }

    return {
      kind: "success",
      data: {
        project: {
          ...project,
          documentCount: (demoDocuments[projectId] ?? []).length,
          testCaseCount: (demoTestCases[projectId] ?? []).length,
          publishedCount: (demoTestCases[projectId] ?? []).filter(
            (item) => item.status === "published",
          ).length,
        },
        documents: demoDocuments[projectId] ?? [],
      },
    };
  }

  if (result.kind === "http-error") {
    if (result.status === 404) {
      return { kind: "not-found" };
    }

    return result;
  }

  return {
    kind: "success",
    data: {
      project: mapProjectSummary(result.data.project),
      documents: result.data.documents.map(mapDocument),
    },
  };
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsResult> {
  const result = await requestJson<RuntimeSettingsApiRecord>("/settings/runtime");

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      settings: demoRuntimeSettings,
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    settings: mapRuntimeSettings(result.data),
  };
}

export async function updateRuntimeSettings(
  payload: RuntimeSettingsUpdateRecord,
): Promise<RuntimeSettingsResult> {
  const result = await putJson<RuntimeSettingsApiRecord>("/settings/runtime", {
    cursor: {
      command: payload.cursor.command,
      timeout_seconds: payload.cursor.timeoutSeconds,
      cwd: payload.cursor.cwd,
    },
    codex: {
      failure_analysis_model: payload.codex.failureAnalysisModel,
    },
    runner: {
      framework: payload.runner.framework,
      language: payload.runner.language,
      pattern: payload.runner.pattern,
      reporter: payload.runner.reporter,
    },
    storage: {
      artifact_root: payload.storage.artifactRoot,
      document_root: payload.storage.documentRoot,
    },
  });

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      settings: demoRuntimeSettings,
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    settings: mapRuntimeSettings(result.data),
  };
}

export async function listProjectEnvironments(
  projectId: string,
): Promise<EnvironmentListResult> {
  const result = await requestJson<EnvironmentApiRecord[]>(projectPath(projectId, "/environments"));

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      environments: demoEnvironments[projectId] ?? [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    environments: result.data.map(mapEnvironment),
  };
}

export async function createProjectEnvironment(
  projectId: string,
  payload: CreateProjectEnvironmentPayload,
): Promise<RequestResult<EnvironmentRecord>> {
  const result = await postJson<EnvironmentApiRecord>(projectPath(projectId, "/environments"), payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapEnvironment(result.data),
  };
}

export async function updateProjectEnvironment(
  environmentId: string,
  payload: UpdateProjectEnvironmentPayload,
): Promise<RequestResult<EnvironmentRecord>> {
  const result = await patchJson<EnvironmentApiRecord>(
    `/environments/${environmentId}`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapEnvironment(result.data),
  };
}

export async function listProjectDocuments(projectId: string): Promise<DocumentAssetListResult> {
  const result = await requestJson<ProjectDocumentApiRecord[]>(projectPath(projectId, "/documents"));

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
  const result = await postJson<ProjectDocumentApiRecord>(projectPath(projectId, "/documents"), payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapDocument(result.data),
  };
}

export async function uploadProjectDocument(
  projectId: string,
  payload: {
    file: File;
    type: string;
    name: string;
    sourceMode?: string;
  },
): Promise<RequestResult<DocumentAsset>> {
  try {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("type", payload.type);
    formData.append("name", payload.name);
    formData.append("source_mode", payload.sourceMode ?? "upload");

    const response = await fetch(`${getApiBaseUrl()}${projectPath(projectId, "/documents/upload")}`, {
      method: "POST",
      body: formData,
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let message: string | undefined;
      try {
        message = parseApiErrorMessage(await response.json());
      } catch {
        message = undefined;
      }

      return {
        kind: "http-error",
        status: response.status,
        message,
      };
    }

    return {
      kind: "success",
      data: mapDocument((await response.json()) as ProjectDocumentApiRecord),
    };
  } catch {
    return {
      kind: "unavailable",
    };
  }
}

export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
): Promise<RequestResult<null>> {
  const result = await requestJson<null>(projectPath(projectId, `/documents/${documentId}`), {
    method: "DELETE",
  });

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: null,
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

export async function listDocumentVersions(
  documentId: string,
): Promise<RequestResult<DocumentVersionRecord[]>> {
  const result = await requestJson<DocumentVersionApiRecord[]>(
    `/documents/${documentId}/versions`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapDocumentVersion),
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

export async function listProjectSkillPackages(
  projectId: string,
): Promise<RequestResult<SkillPackageRecord[]>> {
  const result = await requestJson<SkillPackageApiRecord[]>(projectPath(projectId, "/skill-packages"));

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapSkillPackage),
  };
}

export async function createSkillPackage(
  projectId: string,
  payload: CreateSkillPackagePayload,
): Promise<RequestResult<SkillPackageRecord>> {
  const result = await postJson<SkillPackageApiRecord>(projectPath(projectId, "/skill-packages"), payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapSkillPackage(result.data),
  };
}

export async function listGlobalSkillLibrary(): Promise<RequestResult<GlobalSkillDefinitionRecord[]>> {
  const result = await requestJson<GlobalSkillDefinitionApiRecord[]>("/skills/library");

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapGlobalSkillDefinition),
  };
}

export async function getGlobalSkillLibraryItem(
  skillId: string,
): Promise<RequestResult<GlobalSkillDefinitionRecord>> {
  const result = await requestJson<GlobalSkillDefinitionApiRecord>(`/skills/library/${skillId}`);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillDefinition(result.data),
  };
}

export async function createGlobalSkillLibraryItem(
  payload: GlobalSkillDefinitionCreateRecord,
): Promise<RequestResult<GlobalSkillDefinitionRecord>> {
  const result = await postJson<GlobalSkillDefinitionApiRecord>("/skills/library", payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillDefinition(result.data),
  };
}

export async function updateGlobalSkillLibraryItem(
  skillId: string,
  payload: GlobalSkillDefinitionUpdateRecord,
): Promise<RequestResult<GlobalSkillDefinitionRecord>> {
  const result = await patchJson<GlobalSkillDefinitionApiRecord>(`/skills/library/${skillId}`, payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillDefinition(result.data),
  };
}

export async function listProjectSkillBindings(
  projectId: string,
): Promise<RequestResult<ProjectSkillBindingRecord[]>> {
  const result = await requestJson<ProjectSkillBindingApiRecord[]>(
    projectPath(projectId, "/skill-bindings"),
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapProjectSkillBinding),
  };
}

export async function createProjectSkillBinding(
  projectId: string,
  payload: CreateProjectSkillBindingPayload,
): Promise<RequestResult<ProjectSkillBindingRecord>> {
  const result = await postJson<ProjectSkillBindingApiRecord>(
    projectPath(projectId, "/skill-bindings"),
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapProjectSkillBinding(result.data),
  };
}

export async function setProjectSkillBindingDefault(
  projectId: string,
  bindingId: string,
): Promise<RequestResult<ProjectSkillBindingRecord>> {
  const result = await postJson<ProjectSkillBindingApiRecord>(
    projectPath(projectId, `/skill-bindings/${bindingId}/set-default`),
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapProjectSkillBinding(result.data),
  };
}

export async function updateProjectSkillBinding(
  projectId: string,
  bindingId: string,
  payload: UpdateProjectSkillBindingPayload,
): Promise<RequestResult<ProjectSkillBindingRecord>> {
  const result = await patchJson<ProjectSkillBindingApiRecord>(
    projectPath(projectId, `/skill-bindings/${bindingId}`),
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapProjectSkillBinding(result.data),
  };
}

export async function listGlobalSkillVersions(
  skillId: string,
): Promise<RequestResult<GlobalSkillVersionRecord[]>> {
  const result = await requestJson<GlobalSkillVersionApiRecord[]>(
    `/skills/library/${skillId}/versions`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapGlobalSkillVersion),
  };
}

export async function listGlobalSkillProjectBindings(
  skillId: string,
): Promise<RequestResult<GlobalSkillProjectBindingRecord[]>> {
  const result = await requestJson<GlobalSkillProjectBindingApiRecord[]>(
    `/skills/library/${skillId}/bindings`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapGlobalSkillProjectBinding),
  };
}

export async function getGlobalSkillUsageStats(
  skillId: string,
): Promise<RequestResult<GlobalSkillUsageStatsRecord>> {
  const result = await requestJson<GlobalSkillUsageStatsApiRecord>(
    `/skills/library/${skillId}/usage-stats`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillUsageStats(result.data),
  };
}

export async function createGlobalSkillVersion(
  skillId: string,
  payload: GlobalSkillVersionCreateRecord,
): Promise<RequestResult<GlobalSkillVersionRecord>> {
  const result = await postJson<GlobalSkillVersionApiRecord>(
    `/skills/library/${skillId}/versions`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillVersion(result.data),
  };
}

export async function updateGlobalSkillVersion(
  skillId: string,
  versionId: string,
  payload: GlobalSkillVersionUpdateRecord,
): Promise<RequestResult<GlobalSkillVersionRecord>> {
  const result = await patchJson<GlobalSkillVersionApiRecord>(
    `/skills/library/${skillId}/versions/${versionId}`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillVersion(result.data),
  };
}

export async function publishGlobalSkillVersion(
  skillId: string,
  versionId: string,
): Promise<RequestResult<GlobalSkillVersionRecord>> {
  const result = await postJson<GlobalSkillVersionApiRecord>(
    `/skills/library/${skillId}/versions/${versionId}/publish`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillVersion(result.data),
  };
}

export async function rollbackGlobalSkillVersion(
  skillId: string,
  versionId: string,
): Promise<RequestResult<GlobalSkillVersionRecord>> {
  const result = await postJson<GlobalSkillVersionApiRecord>(
    `/skills/library/${skillId}/versions/${versionId}/rollback`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGlobalSkillVersion(result.data),
  };
}

export async function listSkillPackageVersions(
  skillPackageId: string,
): Promise<RequestResult<SkillPackageVersionRecord[]>> {
  const result = await requestJson<SkillPackageVersionApiRecord[]>(
    `/skill-packages/${skillPackageId}/versions`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapSkillPackageVersion),
  };
}

export async function createSkillPackageVersion(
  skillPackageId: string,
  payload: CreateSkillPackageVersionPayload,
): Promise<RequestResult<SkillPackageVersionRecord>> {
  const result = await postJson<SkillPackageVersionApiRecord>(
    `/skill-packages/${skillPackageId}/versions`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapSkillPackageVersion(result.data),
  };
}

export async function activateSkillPackageVersion(
  projectId: string,
  skillPackageId: string,
  versionId: string,
): Promise<RequestResult<SkillPackageRecord>> {
  const result = await postJson<SkillPackageApiRecord>(
    projectPath(projectId, `/skill-packages/${skillPackageId}/activate/${versionId}`),
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapSkillPackage(result.data),
  };
}

export async function listProjectGenerationTasks(
  projectId: string,
): Promise<GenerationTaskListResult> {
  const result = await requestJson<GenerationTaskApiRecord[]>(projectPath(projectId, "/generation-tasks"));

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
  const result = await postJson<GenerationTaskApiRecord>(projectPath(projectId, "/generation-tasks"), payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapGenerationTask(result.data),
  };
}

export async function listProjectTestCaseDirectories(
  projectId: string,
): Promise<RequestResult<TestCaseDirectoryRecord[]>> {
  const result = await requestJson<TestCaseDirectoryApiRecord[]>(projectPath(projectId, "/test-case-directories"));

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapTestCaseDirectory),
  };
}

export async function listProjectTestCases(projectId: string): Promise<TestCaseListResult> {
  const result = await requestJson<ProjectTestCaseApiRecord[]>(projectPath(projectId, "/test-cases"));

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

export async function createTestCase(
  projectId: string,
  payload: TestCaseMutationPayload,
): Promise<RequestResult<TestCaseRecord>> {
  const result = await postJson<ProjectTestCaseApiRecord>(projectPath(projectId, "/test-cases"), payload);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapTestCase(result.data),
  };
}

export async function importTestCases(
  projectId: string,
  payload: { cases: TestCaseMutationPayload[] },
): Promise<RequestResult<TestCaseRecord[]>> {
  const result = await postJson<ProjectTestCaseApiRecord[]>(
    projectPath(projectId, "/test-cases/import"),
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapTestCase),
  };
}

export async function getTestCase(testCaseId: string): Promise<RequestResult<TestCaseRecord>> {
  const result = await requestJson<ProjectTestCaseApiRecord>(`/test-cases/${testCaseId}`);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapTestCase(result.data),
  };
}

export async function listTestCaseReviews(
  testCaseId: string,
): Promise<RequestResult<ReviewRecord[]>> {
  const result = await requestJson<ReviewApiRecord[]>(`/test-cases/${testCaseId}/reviews`);

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: result.data.map(mapReview),
  };
}

export async function listProjectPublishedTestCases(
  projectId: string,
): Promise<TestCaseListResult> {
  const result = await requestJson<ProjectTestCaseApiRecord[]>(projectPath(projectId, "/published-test-cases"));

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
  const result = await requestJson<AutomationGenerationApiRecord[]>(projectPath(projectId, "/automation-generations"));

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
  const result = await requestJson<AutomationRunApiRecord[]>(projectPath(projectId, "/automation-runs"));

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

export async function listProjectAutomationSchedules(
  projectId: string,
): Promise<AutomationScheduleListResult> {
  const result = await requestJson<AutomationScheduleApiRecord[]>(projectPath(projectId, "/automation-schedules"));

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
    items: result.data.map(mapAutomationSchedule),
  };
}

export async function listProjectAutomationReports(
  projectId: string,
): Promise<AutomationReportListResult> {
  const result = await requestJson<AutomationReportApiRecord[]>(projectPath(projectId, "/automation-reports"));

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
    items: result.data.map(mapAutomationReport),
  };
}

export async function listProjectAutomationFinalReports(
  projectId: string,
): Promise<AutomationFinalReportListResult> {
  const result = await requestJson<AutomationFinalReportApiRecord[]>(projectPath(projectId, "/automation-final-reports"));

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
    items: result.data.map(mapAutomationFinalReport),
  };
}

export async function listProjectAutomationFailureAnalyses(
  projectId: string,
): Promise<AutomationFailureAnalysisListResult> {
  const result = await requestJson<AutomationFailureAnalysisApiRecord[]>(projectPath(projectId, "/automation-failure-analyses"));

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

export async function listProjectAutomationDebugProposals(
  projectId: string,
): Promise<AutomationDebugProposalListResult> {
  const result = await requestJson<AutomationDebugProposalApiRecord[]>(projectPath(projectId, "/automation-debug-proposals"));

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
    items: result.data.map(mapAutomationDebugProposal),
  };
}

export async function listProjectDataSetupHints(
  projectId: string,
): Promise<DataSetupHintListResult> {
  const result = await requestJson<DataSetupHintApiRecord[]>(projectPath(projectId, "/data-setup-hints"));

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      hints: demoDataSetupHints[projectId] ?? [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    hints: result.data.map(mapDataSetupHint),
  };
}

export async function listProjectDataSetupExecutions(
  projectId: string,
): Promise<DataSetupExecutionListResult> {
  const result = await requestJson<DataSetupExecutionApiRecord[]>(projectPath(projectId, "/data-setup-executions"));

  if (result.kind === "unavailable") {
    return {
      kind: "unavailable",
      executions: demoDataSetupExecutions[projectId] ?? [],
    };
  }

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    executions: result.data.map(mapDataSetupExecution),
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

export async function createAutomationDebugProposal(
  analysisId: string,
): Promise<RequestResult<AutomationDebugProposalRecord>> {
  const result = await postJson<AutomationDebugProposalApiRecord>(
    `/automation-failure-analyses/${analysisId}/debug-proposals`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationDebugProposal(result.data),
  };
}

export async function reviewAutomationDebugProposal(
  proposalId: string,
  payload: ReviewAutomationDebugProposalPayload,
): Promise<RequestResult<AutomationDebugProposalRecord>> {
  const result = await patchJson<AutomationDebugProposalApiRecord>(
    `/automation-debug-proposals/${proposalId}/review`,
    payload,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationDebugProposal(result.data),
  };
}

export async function createAutomationDebugProposalRerun(
  proposalId: string,
): Promise<RequestResult<AutomationRunRecord>> {
  const result = await postJson<AutomationRunApiRecord>(
    `/automation-debug-proposals/${proposalId}/rerun`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationRun(result.data),
  };
}

export async function createAutomationFinalReport(
  runId: string,
): Promise<RequestResult<AutomationFinalReportRecord>> {
  const result = await postJson<AutomationFinalReportApiRecord>(
    `/automation-runs/${runId}/final-report`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationFinalReport(result.data),
  };
}

export async function pushAutomationFinalReportToLark(
  reportId: string,
): Promise<RequestResult<AutomationFinalReportRecord>> {
  const result = await postJson<AutomationFinalReportApiRecord>(
    `/automation-final-reports/${reportId}/push-lark`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationFinalReport(result.data),
  };
}

export async function createAutomationRerun(
  analysisId: string,
): Promise<RequestResult<AutomationRunRecord>> {
  const result = await postJson<AutomationRunApiRecord>(
    `/automation-failure-analyses/${analysisId}/rerun`,
  );

  if (result.kind !== "success") {
    return result;
  }

  return {
    kind: "success",
    data: mapAutomationRun(result.data),
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
  payload: Partial<TestCaseMutationPayload>,
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
