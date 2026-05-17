# TestOps Test Case Platform Design

## 1. Overview

This document defines the first sub-project of the TestOps platform: a test case platform for a single internal QA team. The platform ingests PRD, Figma, and Swagger inputs, uses AI to generate structured test cases, supports human review and revision, and publishes approved test cases as the formal upstream asset for later automation generation.

The first sub-project does not execute Playwright tests yet, but it must preserve the right data model and interfaces so that later phases can generate Playwright + TypeScript + POM + Allure assets, schedule runs, and push execution summaries to Lark.

## 2. Goals

- Provide a single internal platform for managing project-level testing assets.
- Support mixed input modes:
  - PRD via file upload
  - Figma via link
  - Swagger/OpenAPI via file upload or URL
- Generate structured test cases through AI providers.
- Allow QA users to review, edit, split, merge, approve, and publish generated test cases.
- Preserve traceability from every test case back to source document versions and generation tasks.
- Precompute downstream metadata for future automation generation:
  - automation suitability
  - automation notes
  - data setup hints from Swagger
- Support a modular architecture with dual AI providers:
  - Cursor
  - OpenAI

## 3. Non-Goals

The first sub-project will not implement the following end-user features:

- Playwright code generation
- automated test execution
- scheduled execution
- Allure report generation
- failed test diagnosis and self-healing
- multi-tenant or enterprise-wide permission centers
- real-time collaborative editing

These remain follow-up sub-projects and must consume published test cases from this platform.

## 4. Product Scope

### 4.1 Team and User Model

- Intended for one internal QA team in phase 1.
- Platform keeps a `Project` concept from the beginning.
- Phase 1 roles:
  - `admin`
  - `tester`

### 4.2 Project and Environment Model

- The platform is initially used for one target system, but it must support multiple projects in the data model.
- Environment management is not fully implemented in this sub-project.
- Test cases and data setup hints may carry environment tags so later modules can reuse them.

### 4.3 Input Sources

- PRD: `pdf`, `docx`, `md`
- Figma: link-based input, with metadata extraction where available
- Swagger/OpenAPI: `json`, `yaml`, or URL

### 4.4 Output Assets

- structured test case drafts
- approved and published test cases
- automation candidate metadata
- data setup hint metadata
- generation and review history

## 5. Core Design Principles

### 5.1 Test Case as the Primary Business Asset

The platform is test-case-centric. Source documents are important evidence, but the platform's primary object is the reviewed and published test case.

### 5.2 Human-in-the-Loop Control

AI produces high-quality drafts, not final truth. Human review is mandatory before any test case becomes publishable downstream input.

### 5.3 Strong Traceability

Every generated or edited test case must be traceable to:

- project
- source documents
- source document versions
- generation task
- provider and prompt version
- revision history

### 5.4 Modular Monolith for Phase 1

The platform is deployed as one web/API application plus one worker service, but code boundaries are enforced through clear modules.

### 5.5 Downstream Readiness

Even though execution is out of scope, published test cases must already contain enough structure to support later Playwright generation and Swagger-based data setup.

## 6. Recommended Technical Architecture

### 6.1 High-Level Shape

- Frontend: `Next.js + TypeScript`
- Backend API: `FastAPI`
- Async workers: `Celery` or equivalent Redis-backed worker framework
- Database: `PostgreSQL`
- Cache/queue: `Redis`
- File storage: local object-storage-like layout in phase 1, compatible with later MinIO/S3 migration
- AI providers:
  - Cursor
  - OpenAI
- Notifications:
  - Lark adapter reserved for later execution/reporting modules

### 6.2 Deployment Shape

- one web/API deployment
- one worker deployment
- one PostgreSQL instance
- one Redis instance
- one storage location for uploaded artifacts

This matches the selected "platform monolith with explicit submodules" approach.

## 7. Module Boundaries

### 7.1 `project` module

Responsibilities:

- manage project metadata
- store project-level defaults
- store role assignments

### 7.2 `document` module

Responsibilities:

- upload and manage source documents
- manage document types
- create document versions
- trigger parsing
- store parsing metadata and extracted summaries

### 7.3 `generation` module

Responsibilities:

- create generation tasks
- orchestrate provider calls
- attach input references
- store raw output and structured intermediate output
- perform validation and normalization

### 7.4 `testcase` module

Responsibilities:

- manage current test case records
- manage revision history
- support split, merge, edit, archive, publish

### 7.5 `review` module

Responsibilities:

- collect review decisions and comments
- store reviewer actions
- drive state transitions

### 7.6 `provider` module

Responsibilities:

- abstract Cursor and OpenAI
- normalize request and response handling
- handle retry, timeout, model selection, and prompt version tagging

### 7.7 `parser` module

Responsibilities:

- PRD text extraction and sectioning
- Figma metadata retrieval and normalization
- Swagger/OpenAPI parsing
- data setup hint precomputation inputs

### 7.8 `notification` module

Responsibilities:

- reserve outbound event interfaces for Lark
- no major user-facing workload in sub-project 1

## 8. Domain Model

### 8.1 `Project`

Fields:

- `id`
- `name`
- `code`
- `description`
- `status`
- `default_provider`
- `default_prompt_profile`
- `created_at`
- `updated_at`

### 8.2 `DocumentAsset`

Fields:

- `id`
- `project_id`
- `type` (`prd`, `figma`, `swagger`)
- `name`
- `source_mode` (`upload`, `url`, `external_link`)
- `source_uri`
- `created_by`
- `created_at`

### 8.3 `DocumentVersion`

Fields:

- `id`
- `document_asset_id`
- `version_no`
- `storage_path`
- `checksum`
- `parse_status`
- `parse_summary`
- `structured_metadata`
- `created_by`
- `created_at`

### 8.4 `GenerationTask`

Fields:

- `id`
- `project_id`
- `status`
- `provider`
- `model`
- `prompt_version`
- `input_refs`
- `started_at`
- `finished_at`
- `error_message`
- `created_by`
- `created_at`

### 8.5 `GenerationOutput`

Fields:

- `id`
- `generation_task_id`
- `raw_response`
- `normalized_payload`
- `validation_report`
- `created_at`

### 8.6 `TestCase`

Fields:

- `id`
- `project_id`
- `case_code`
- `title`
- `module`
- `feature`
- `case_type`
- `priority`
- `preconditions`
- `steps`
- `expected_results`
- `tags`
- `source_refs`
- `automation_flag`
- `automation_notes`
- `status`
- `current_revision_id`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 8.7 `TestCaseRevision`

Fields:

- `id`
- `test_case_id`
- `revision_no`
- `source_type` (`ai_generated`, `human_edited`, `system_normalized`)
- `content_snapshot`
- `diff_summary`
- `editor_id`
- `created_at`

### 8.8 `TestCaseReview`

Fields:

- `id`
- `test_case_id`
- `reviewer_id`
- `action` (`comment`, `request_change`, `approve`, `reject`, `publish`)
- `comment`
- `created_at`

### 8.9 `AutomationCandidate`

Fields:

- `id`
- `test_case_id`
- `suitability`
- `ui_target_type`
- `requires_login`
- `requires_data_setup`
- `notes`
- `created_at`
- `updated_at`

### 8.10 `DataSetupHint`

Fields:

- `id`
- `test_case_id`
- `swagger_source_ref`
- `endpoint`
- `method`
- `parameter_template`
- `purpose`
- `environment_tags`
- `confidence_score`
- `created_at`

## 9. Test Case Structure

Test cases must be stored as structured content rather than one large text block.

Required logical fields:

- title
- module
- feature
- case type
- priority
- preconditions
- ordered steps
- ordered expected results
- tags
- automation flag
- source references

Reasoning:

- better review ergonomics
- easier diffing
- easier mapping to future Playwright actions/assertions
- easier extraction of downstream automation metadata

## 10. Key Workflows

### 10.1 Document Ingestion

1. user selects project
2. user uploads PRD, enters Figma link, and uploads or links Swagger
3. system creates `DocumentAsset`
4. system creates new `DocumentVersion`
5. parse task is triggered asynchronously
6. parser stores summaries and structured metadata

### 10.2 Generation Workflow

1. user selects document versions to use as generation inputs
2. user triggers generation task
3. backend creates `GenerationTask`
4. worker collects parsed inputs and prompt profile
5. provider module sends request to Cursor or OpenAI
6. raw output is normalized
7. validation logic checks:
   - structure completeness
   - duplicate or highly similar cases
   - missing expected results
   - malformed steps
8. valid outputs become `TestCase` drafts plus first `TestCaseRevision`

### 10.3 Review Workflow

1. tester opens draft cases in review workspace
2. tester edits fields and step structure
3. tester may split one generated case into multiple cases
4. tester may merge overlapping cases
5. tester marks automation suitability and adds notes
6. tester requests changes, approves, or rejects
7. approved cases may later be published

### 10.4 Publish Workflow

1. tester or admin selects approved cases
2. publish action freezes current reviewed content as downstream-facing version
3. `published` cases become available to future automation generation APIs

## 11. State Machines

### 11.1 Document Version Status

- `uploaded`
- `parsing`
- `parsed`
- `parse_failed`

### 11.2 Generation Task Status

- `pending`
- `running`
- `validating`
- `completed`
- `failed`
- `partial_completed`

### 11.3 Test Case Status

- `draft`
- `pending_review`
- `in_review`
- `approved`
- `published`
- `rejected`
- `needs_update`
- `archived`

Important distinction:

- `approved` means the case is accepted by reviewers
- `published` means the case is formally exposed to downstream modules

## 12. API Design

### 12.1 Project APIs

- `POST /projects`
- `GET /projects`
- `GET /projects/{id}`
- `PATCH /projects/{id}`

### 12.2 Document APIs

- `POST /projects/{id}/documents`
- `GET /projects/{id}/documents`
- `GET /documents/{id}`
- `POST /documents/{id}/versions`
- `GET /documents/{id}/versions`
- `POST /document-versions/{id}/parse`

### 12.3 Generation APIs

- `POST /projects/{id}/generation-tasks`
- `GET /projects/{id}/generation-tasks`
- `GET /generation-tasks/{id}`
- `POST /generation-tasks/{id}/retry`

### 12.4 Test Case APIs

- `GET /projects/{id}/test-cases`
- `GET /test-cases/{id}`
- `PATCH /test-cases/{id}`
- `POST /test-cases/{id}/split`
- `POST /test-cases/merge`
- `POST /test-cases/{id}/publish`

### 12.5 Review APIs

- `POST /test-cases/{id}/reviews`
- `GET /test-cases/{id}/reviews`

### 12.6 Downstream Handoff APIs

- `GET /projects/{id}/published-test-cases`
- `GET /test-cases/{id}/automation-candidate`
- `GET /test-cases/{id}/data-setup-hints`

## 13. Frontend Information Architecture

### 13.1 Project Home

Displays:

- project summary
- recent uploads
- recent generation tasks
- pending review counts
- recently published cases

### 13.2 Document Center

Displays:

- PRD assets and versions
- Figma links and metadata
- Swagger assets and versions
- parse status
- reparse actions

### 13.3 Generation Task Page

Displays:

- selected inputs
- provider/model used
- task status
- validation summary
- task logs and failure reasons

### 13.4 Test Case List

Displays:

- searchable/filterable test cases
- status filters
- tags
- automation suitability
- bulk actions

### 13.5 Test Case Detail

Displays:

- structured content
- source references
- revision timeline
- review history
- automation candidate and data setup hints

### 13.6 Review Workspace

Focuses on:

- draft review queue
- sequential editing
- split/merge operations
- approve/reject/publish actions

### 13.7 Admin Settings

Displays:

- provider configuration
- prompt profiles
- project defaults
- role assignments

## 14. Permission Model

### 14.1 Admin

Can:

- manage projects
- manage providers and prompt profiles
- manage document sources
- trigger generation
- review and publish cases

### 14.2 Tester

Can:

- upload documents
- trigger generation
- review, edit, approve, reject, and publish cases
- view generation history

This is intentionally lightweight for phase 1 and avoids fine-grained permission complexity.

## 15. AI Provider Strategy

### 15.1 Provider Abstraction

The backend must expose a unified provider interface, with implementations for:

- Cursor
- OpenAI

The interface should support:

- model selection
- prompt template versioning
- retry policy
- timeout policy
- response normalization
- provider-specific audit fields

### 15.2 Prompting Strategy

Generation prompts should request:

- structured output
- standard field names
- distinction between steps and expectations
- automation suitability hints
- likely data setup requirements from Swagger context

The platform must store:

- prompt version
- provider
- model
- normalized output

## 16. Parsing Strategy

### 16.1 PRD

- extract text
- detect headings and sections
- preserve section references for traceability

### 16.2 Figma

- store link
- capture metadata and referenced page/frame identifiers where possible
- use design context as supportive input, not as the only truth source

### 16.3 Swagger/OpenAPI

- parse endpoints, methods, schemas, and required parameters
- build structured candidates for future `DataSetupHint`

Swagger is not used only for storage; it is part of the preparation layer for future automated preconditions.

## 17. Error Handling and Reliability

### 17.1 Upload and Parse Failures

- failed uploads must not create ambiguous document versions
- parse failures must be visible in UI
- reparsing must be supported

### 17.2 Generation Failures

- generation task failures must preserve input refs, provider, model, and failure reason
- retry must be supported without losing history

### 17.3 Validation Failures

- malformed AI output should not directly enter published test case tables
- partial completion must be allowed when some cases are valid and others fail validation

### 17.4 Concurrency

- review edits should be revisioned
- accidental overwrite of reviewed content should be prevented through optimistic locking or revision checks

## 18. Auditability and Observability

Must capture:

- uploader
- generator
- reviewer
- provider
- prompt version
- status transitions
- revision history
- task timing
- failure reasons

Operational visibility should include:

- task queue metrics
- parse success/failure rates
- generation success/failure rates
- provider latency and error rate

## 19. Testing Strategy

### 19.1 Backend

- unit tests for parser logic
- unit tests for provider interface normalization
- unit tests for validation and deduplication logic
- API integration tests for project, document, generation, and test case workflows
- worker integration tests for async task orchestration

### 19.2 Frontend

- component tests for key workflows
- page-level tests for upload, generation status, list filtering, and review editing

### 19.3 End-to-End

- ingest PRD + Figma + Swagger
- complete generation task
- review and publish selected cases
- verify downstream handoff API returns published cases and hints

## 20. Security and Operational Considerations

- uploaded documents may contain sensitive internal product information
- provider secrets must remain in server-side configuration only
- provider selection and model configuration must be admin-controlled
- external calls to providers should be logged with minimal necessary metadata
- storage layout must support later migration to managed object storage

## 21. Phase-1 Deliverables

Phase 1 must produce:

- project management basics
- document center with versioning
- parsing pipeline
- AI generation tasks with Cursor and OpenAI provider support
- structured draft test case creation
- review workspace
- revision history and traceability
- publish workflow
- downstream handoff APIs for published cases, automation candidates, and data setup hints

## 22. Deferred Work for Next Sub-Projects

- Playwright + TypeScript + POM generation
- Swagger-guided data creation execution
- scheduled execution
- Allure aggregation
- failure analysis using AI
- self-healing and rerun workflow
- Lark execution result notifications

## 23. Recommended Next Step

After this design is approved, the next artifact should be an implementation plan focused only on sub-project 1, using the selected architecture:

- modular monolith
- Next.js frontend
- FastAPI backend
- PostgreSQL + Redis
- Cursor + OpenAI provider abstraction
- document ingestion, generation, review, and publish workflows
