# TestOps P0 Main Chain Design

> Scope: make the platform mature enough for reliable internal use on the primary chain `document upload + skill package -> knowledge extraction -> Cursor generation -> review -> supplement generation -> publish`.

## 1. Goal

TestOps P0 must stop behaving like a workflow prototype and become a usable internal production tool for AI-assisted test case generation.

The P0 goal is:

- QA can upload PRD, business-rule, and supplementary documents into one project.
- Each system can bind an archived skill package managed inside TestOps.
- The platform automatically versions and parses those documents into structured knowledge.
- Cursor receives a grounded context package built from `documents + active skill package`, instead of raw document ids.
- Generated test cases are traceable, reviewable, and safe to publish.
- If coverage is incomplete, the reviewer can optimize the prompt and trigger AI again to supplement missing scenarios without overwriting reviewed cases.

P0 success means the team can run the full main chain repeatedly on real project material without relying on manual hidden steps outside the platform.

## 2. Why The Current Platform Is Not Mature Enough

The current platform has a usable shell, but its main chain breaks in four places:

1. Document upload ends at `DocumentAsset`.
   The platform stores uploaded files, but upload does not automatically create `DocumentVersion` and does not automatically parse it.

2. Parsing is too weak for real test design work.
   PRD parsing is only section splitting. Business rules, field constraints, acceptance criteria, state transitions, and ambiguity points are not extracted into a reliable structure.

3. Generation is not grounded.
   Cursor currently receives `project_id`, `prompt_version`, and `document_ids`, but not the parsed content that actually defines system behavior.

4. Test cases are not fully traceable.
   The current `TestCase` model lacks source references, revision linkage, and generation evidence needed for stable review and later maintenance.

Because of these four gaps, the platform can produce draft cases, but it cannot yet produce trustworthy cases.

## 3. P0 Scope

### 3.1 In Scope

- document asset upload
- automatic document version creation
- automatic parse trigger after successful version creation
- support for `prd`, `business_rule`, and `supplement` as first-class generation inputs
- system-level skill package archive and active-version selection
- structured parse output for generation
- generation context assembly layer
- Cursor prompt/profile management for test-case generation
- supplement-generation workflow for missing scenarios
- test case traceability fields
- review workflow support for source inspection
- validation rules for generated payloads
- main-chain observability and acceptance testing

### 3.2 Out Of Scope

- Playwright artifact generation improvements
- schedule/run/report/failure-analysis redesign
- enterprise role center
- real-time collaborative editing
- advanced automation self-healing

Those areas stay in the repo, but P0 does not expand them.

## 4. Product Principles For P0

### 4.1 Source-First, Not Prompt-First

The system should improve generation quality primarily by improving structured source context, not by endlessly tuning one long prompt.

### 4.2 Versioned Inputs Only

Generation must run against explicit document versions and explicit skill-package versions, never against loose assets or floating prompt text.

### 4.3 Evidence Over Guessing

Every generated case must either:

- cite its source evidence, or
- be marked as inferred, or
- be marked as a clarification item.

The platform must not silently turn undocumented assumptions into normal P0 cases.

### 4.4 Human Review Stays Mandatory

AI drafts are a productivity layer, not the source of truth.

### 4.5 Regeneration Must Be Incremental

When reviewers discover missing scenarios, the platform must support supplement generation against the reviewed baseline.

The system must not solve missing coverage by blindly replacing the entire case set.

## 5. Target User Workflow

The P0 workflow becomes:

1. User creates/selects a project.
2. User uploads one or more source documents.
3. System creates `DocumentAsset`.
4. System immediately creates `DocumentVersion`.
5. System automatically dispatches parse.
6. Parser writes structured knowledge and parse summary.
7. User opens document center and selects exact versions for generation.
8. User selects the active skill package version for the target system.
9. System builds a generation context bundle from parsed knowledge plus active skill package.
10. Cursor generates structured draft test cases.
11. System validates, normalizes, and persists generation output plus evidence.
12. Reviewer edits, approves, or requests changes while inspecting source refs.
13. If missing scenarios remain, reviewer submits supplement prompt/coverage intent and triggers AI again in supplement mode.
14. Approved cases are published for downstream use.

The user should not need to manually stitch together hidden upload/version/parse steps.

## 6. Recommended Approach

Use gradual enhancement on top of the current modular monolith.

Do not rewrite the whole platform. Keep the existing modules:

- `document`
- `parser`
- `generation`
- `provider`
- `testcase`
- `review`
- `settings`

Add one new capability layer:

- `knowledge_context`
- `skills`

This new layer is responsible for turning parsed document versions into a compact, provider-ready context package.

This approach is recommended because:

- it reuses the current models and routes,
- it limits blast radius,
- it improves the weakest part of the product directly,
- it leaves phase-two automation modules untouched.

## 7. Functional Design

### 7.1 Document Types

P0 document types:

- `prd`
- `business_rule`
- `supplement`
- `swagger`
- `figma`

Generation-critical types are `prd` and `business_rule`.

`supplement` is optional but recommended.

`swagger` and `figma` remain supportive inputs and must not crowd out the main chain.

Definitions:

- `prd`: product requirement and interaction definition
- `business_rule`: rule statements, permissions, formulas, status rules, exception handling
- `supplement`: clarifications, meeting conclusions, data dictionaries, field notes, old case notes

### 7.2 System Skill Package

Each target system must have one or more archived skill packages managed inside TestOps.

The skill package is not a casual prompt string. It is a versioned generation asset used together with source documents.

Required P0 skill-package content:

- system generation prompt template
- scenario taxonomy
- output schema rules
- terminology and domain glossary
- sample good test cases
- negative examples or anti-pattern notes
- review checklist

Each generation run must record which skill-package version was used.

### 7.3 Upload And Versioning

When a file upload succeeds:

1. create `DocumentAsset`
2. create `DocumentVersion`
3. persist artifact path/checksum
4. set `parse_status = queued`
5. dispatch parse automatically

URL-based documents should also create a `DocumentVersion`, even when the file content is external.

The platform should treat version creation as the canonical point where a document becomes usable input.

### 7.3 Parsing

Parsing must produce two outputs:

1. `parse_summary`
   A short operator-facing summary, such as:
   - detected sections
   - extracted rule count
   - field definitions count
   - ambiguity count
   - parse errors/warnings

2. `structured_metadata`
   A machine-facing structured payload for generation.

Required P0 parse shapes:

#### PRD

- sections
- acceptance criteria
- field definitions
- user actions
- page/process flow references

#### Business Rule

- rule statements
- conditions
- outcomes
- constraints
- exception rules
- permission/status rules

#### Supplement

- clarifications
- glossary/data dictionary
- open questions
- override notes

#### Swagger

- endpoints
- methods
- summaries
- setup candidates

#### Figma

- frame/page identifiers
- high-level UI nodes

P0 does not need perfect semantic parsing, but it must produce stable, explicit structures that can be reasoned over.

### 7.4 Knowledge Context Assembly

Add a new service layer that takes selected `DocumentVersion` ids and returns a normalized generation bundle.

The bundle must include:

- project id
- selected version ids
- document type grouping
- condensed source summaries
- extracted rules
- extracted acceptance criteria
- extracted field constraints
- explicit ambiguities
- supportive swagger/figma hints
- active skill-package summary
- scenario taxonomy from the skill package
- sample-case patterns from the skill package

The bundle must also preserve source locations for later citation.

This layer is the main P0 addition because it converts parsed knowledge into generation input.

### 7.5 Generation

Generation must change from:

- `input_document_ids`

to:

- `input_document_version_ids`
- `input_skill_version_id`
- `context_bundle_id` or inlined normalized context bundle
- `generation_mode`

The Cursor prompt must request:

- structured output
- test case title/module/feature/priority
- preconditions
- ordered steps
- ordered expected results
- source refs per case
- inferred flag when not directly explicit
- clarification items for missing rule decisions
- skill-package scenario category per case

P0 generation modes:

- `full`
  Generate the initial case set from selected documents plus active skill package.

- `supplement`
  Generate only missing scenarios based on:
  - existing reviewed/pending cases
  - uncovered rules
  - reviewer prompt optimization input

Supplement generation must not overwrite published cases and must not silently mutate reviewer-edited cases.

The system must store:

- raw provider response
- normalized output
- validation report
- prompt profile
- provider/model metadata

### 7.6 Test Case Structure

P0 `TestCase` content must support:

- title
- module
- feature
- case_type
- priority
- preconditions
- steps
- expected_results
- tags
- automation_flag
- automation_notes
- source_refs
- generation_task_id
- current_revision_id
- scenario_category
- origin_mode

P0 `source_refs` must allow:

- document asset id
- document version id
- document type
- source section/rule identifier
- source excerpt or normalized summary key
- ref mode: `explicit` or `inferred`

### 7.7 Review

Review page must let a reviewer:

- inspect the generated case
- inspect source refs for that case
- understand whether a line is explicit or inferred
- flag missing evidence
- request change
- approve
- publish
- mark missing scenario coverage
- trigger supplement generation with reviewer prompt optimization

The review workflow must distinguish three actions:

- manual edit
- feedback on evidence quality
- feedback on scenario coverage gaps

P0 review does not require split/merge yet, but it does require visibility into evidence.

## 8. Data Model Changes

### 8.1 `DocumentAsset`

Keep current model, extend type vocabulary to include:

- `business_rule`
- `supplement`

### 8.2 `DocumentVersion`

Keep current model, but standardize parse status to:

- `uploaded`
- `queued`
- `processing`
- `parsed`
- `failed`

### 8.3 New `GenerationOutput`

Add explicit storage for:

- `generation_task_id`
- `raw_response`
- `normalized_payload`
- `validation_report`
- `created_at`

### 8.4 `GenerationTask`

Add or standardize:

- `input_refs.document_version_ids`
- `input_refs.document_asset_ids`
- `input_refs.skill_version_id`
- `input_refs.document_type_summary`
- `generation_mode`
- `parent_generation_task_id`
- `prompt_optimization_note`
- `status` support for `validating` and `partial_completed`

### 8.5 `TestCase`

Add:

- `source_refs`
- `generation_task_id`
- `current_revision_id`
- `scenario_category`
- `origin_mode`

### 8.6 New `SkillPackage` And `SkillPackageVersion`

P0 needs a versioned system-level skill archive.

Required fields:

- `system_key`
- `name`
- `status`
- `active_version_id`

Version fields:

- `skill_package_id`
- `version_no`
- `storage_uri`
- `structured_metadata`
- `summary`
- `created_at`

### 8.7 New `TestCaseRevision`

Add revision records for:

- initial AI generation
- human edits
- normalization adjustments

This is needed for mature use because reviewed cases will evolve over time.

## 9. API Design Changes

### 9.1 Document APIs

Keep existing routes, but behavior changes:

- `POST /projects/{id}/documents/upload`
  Must create asset and first version automatically.

Add:

- `GET /documents/{id}/versions`
- `POST /document-versions/{id}/reparse`

### 9.2 Generation APIs

Change request body to prefer:

- `input_document_version_ids`
- `input_skill_version_id`
- `generation_mode`
- `prompt_optimization_note`

Keep compatibility path for `input_document_ids` during migration, but the backend should resolve them to latest parsed versions only as a temporary fallback.

Add:

- `GET /generation-tasks/{id}/output`

### 9.3 Skill Package APIs

Add:

- `POST /projects/{id}/skill-packages`
- `GET /projects/{id}/skill-packages`
- `POST /skill-packages/{id}/versions`
- `GET /skill-packages/{id}/versions`
- `POST /projects/{id}/skill-packages/{skill_package_id}/activate/{version_id}`

### 9.4 Test Case APIs

Case read endpoints must return:

- `source_refs`
- `generation_task_id`
- current revision metadata

Add:

- `GET /test-cases/{id}/revisions`

## 10. Frontend Design Changes

### 10.1 Document Center

This page must become real instead of redirect-only.

It should show:

- document assets by type
- version history
- parse status
- parse summary
- selected-for-generation state
- reparse action

### 10.2 Project Workspace Upload Panel

Upload should:

- show version creation result
- show parse queued/processing state
- stop pretending that asset-only upload is enough

### 10.3 Generation Page

Generation page should let users:

- choose parsed document versions, not ids typed by hand
- choose active skill package version
- inspect parse summary before generation
- choose provider/model/prompt profile
- see validation summary after generation
- run supplement generation with prompt optimization notes

### 10.4 Review Page

Review page should show:

- generated content
- source refs panel
- inferred markers
- clarification items
- missing-scenario feedback entry
- supplement-generation action

## 11. Validation Rules

P0 generation validation must check:

- cases list exists
- title exists
- steps exist and are non-empty
- expected results exist and are non-empty
- module/feature/priority are present
- source refs exist per case
- duplicate or near-duplicate titles
- blank evidence refs
- uncovered rule references when compared with selected rule set
- missing scenario categories defined by the active skill package

The validator should return structured issues, not only fail/throw.

Validation outcomes:

- `completed`
  All cases valid

- `partial_completed`
  Some cases valid, some rejected

- `failed`
  No valid cases

## 12. Prompt Profile Design

Prompt profiles must move from a string label to a configurable concept.

P0 profile fields:

- profile name
- provider
- model
- instruction template
- output schema version
- source citation rules
- inference policy
- clarification policy
- active flag

The prompt profile must be distinct from the system skill package:

- prompt profile controls provider-side instruction strategy
- skill package controls system/domain-specific generation knowledge

P0 does not need a full UI editor for every prompt detail, but the backend and settings model must support more than one hardcoded profile.

## 13. Migration Strategy

Use safe incremental migration:

1. extend document types
2. add skill-package archive and activation model
3. add version-based upload behavior
4. add parse summary enhancements
5. add generation output persistence
6. add source refs and revision tables
7. switch frontend generation selection from asset ids to version ids
8. add supplement-generation workflow
9. deprecate asset-only generation path

This order keeps the platform usable during transition.

## 14. Testing Strategy

### 14.1 Backend

Must add tests for:

- upload creates asset + version + parse dispatch
- parser supports new document types
- skill package can be versioned and activated per system
- context assembler returns grounded bundle
- generation request uses document version ids
- generation request uses active skill-package version
- validator emits structured issues
- test cases persist source refs
- supplement generation creates only additive cases

### 14.2 Worker

Must add tests for:

- parse task per document type
- context assembly with mixed inputs
- generation partial completion behavior

### 14.3 Frontend

Must add tests for:

- document center rendering with version/parse states
- generation form uses selected versions
- review page displays source refs

### 14.4 End-To-End

Need one golden happy-path scenario:

- upload PRD
- upload business rule doc
- activate skill package version
- parse all
- generate via Cursor
- review with source refs
- submit prompt optimization for missing scenarios
- run supplement generation
- publish

## 15. Acceptance Criteria

P0 is acceptable only when all of the following are true:

1. Uploading a source document automatically creates a version and queues parsing.
2. The platform supports `prd`, `business_rule`, and `supplement` as generation inputs.
3. Each system can bind and activate a versioned skill package inside TestOps.
4. A generation task can be created from selected parsed document versions and active skill-package version.
5. Cursor receives structured context, not just ids.
6. Generated test cases include source refs.
7. Reviewers can inspect source refs before approval.
8. Missing scenarios can be supplemented via prompt optimization and AI rerun without overwriting approved content.
9. The system records generation output and validation result.
10. The main chain is covered by repeatable automated tests.

## 16. Recommendation

Execute this as the top priority before any additional automation-phase feature work.

The platform already has enough secondary capability surface area. What it lacks is a trustworthy center.

Making the main chain mature is the highest-value move because every later automation capability depends on stable published cases, and stable published cases depend on grounded generation.
