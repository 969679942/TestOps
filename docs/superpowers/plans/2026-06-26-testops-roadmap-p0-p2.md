# TestOps Main Chain P0-P2 Roadmap

**Goal:** Make TestOps mature enough for real production-style internal use by building a stable main chain for `document upload + skill package + AI generation + review + supplement generation`.

**Positioning:** This roadmap is for product, engineering, and AI execution handoff. It is not a feature wishlist. Every phase must end in a usable, testable product increment.

---

## 1. Overall Strategy

The correct priority is:

1. build the system main chain first
2. make `skills` a first-class platform asset at the same time
3. optimize generation quality only after the workflow is stable

The platform must not be built as a prompt playground.

The real product value is:

- versioned source documents
- versioned system skill packages
- grounded generation
- online review and revision
- additive supplement generation

---

## 2. Phase Summary

### P0: Main Chain Available

Goal: make the first complete and usable workflow run end to end.

Core outcome:

- users can upload PRD, business-rule, and supplement documents
- the system versions and parses them automatically
- each project can bind an active skill-package version
- AI can generate test cases from `document versions + skill version`
- users can review and edit cases online

### P1: Main Chain Reliable

Goal: make the workflow stable enough for repeated team use.

Core outcome:

- review evidence is visible and traceable
- generation output is structured and validated
- skill packages are manageable and reusable
- missing scenarios can be supplemented without destroying reviewed results

### P2: Main Chain Optimized

Goal: improve generation quality, coverage, and operating efficiency.

Core outcome:

- scenario coverage becomes more complete
- duplicate and low-value cases decrease
- domain skills become more specialized
- teams can operate the platform with lower manual correction cost

---

## 3. P0 Plan

### P0 Objective

Deliver the first production-usable closed loop:

`upload -> version -> parse -> select skill package -> generate -> review/edit`

### P0 Scope

- document upload
- automatic document version creation
- automatic parse trigger
- support document types: `prd`, `business_rule`, `supplement`
- project-level skill-package archive and active version selection
- generation request based on `input_document_version_ids + input_skill_version_id`
- online test-case review and manual editing
- basic generation result persistence

### P0 Deliverables

#### Product deliverables

- document center page
- skill package management page
- generation task page
- review/edit page

#### Backend deliverables

- `DocumentAsset` + `DocumentVersion` closed upload flow
- parsing pipeline for PRD, business rules, and supplements
- `SkillPackage` and `SkillPackageVersion`
- generation task persistence with versioned inputs
- basic testcase persistence

#### AI deliverables

- one MVP skill-package structure
- one grounded generation prompt contract
- one stable output schema for generated test cases

### P0 Skills Standard

P0 only needs a minimum usable skill package.

Required content:

- prompt template
- scenario taxonomy
- terminology glossary
- output schema rules
- 3-5 good case examples
- review checklist

P0 does not require complex multi-skill orchestration.

### P0 Risks

- upload exists but version creation is still incomplete
- parser output is too shallow to support generation
- generation still depends on raw ids instead of parsed context
- binary uploads such as `pdf/docx` are corrupted during persistence
- skill package exists in UI but is not truly linked to generation input
- generated cases can be edited but lack later traceability

### P0 Acceptance Criteria

- uploading a file creates a document version automatically
- parsing is queued automatically after upload
- PRD, business-rule, and supplement files are all supported
- a project can create and activate a skill-package version
- generation requires document versions and one active skill version
- generated test cases can be reviewed and edited online
- a team member can run the full main chain without hidden manual steps

### P0 Exit Gate

P0 is complete only when one full project can run through the chain with real material and publish a first batch of usable test cases.

---

## 4. P1 Plan

### P1 Objective

Make the main chain reliable, reviewable, and safe for repeated use.

### P1 Scope

- source evidence and traceability for each generated case
- testcase revision history
- generation output persistence: raw response, normalized payload, validation report
- supplement generation for missing scenarios
- additive merge logic for supplement cases
- validation rules for incomplete, duplicated, and weak-evidence cases

### P1 Deliverables

#### Product deliverables

- review evidence panel
- revision history view
- supplement-generation action in review page
- coverage-gap feedback input

#### Backend deliverables

- `GenerationOutput`
- `TestCaseRevision`
- supplement-generation mode and parent-child generation linkage
- validation result model and issue classification

#### AI deliverables

- supplement prompt contract
- inferred-vs-explicit evidence labeling
- scenario-gap supplement strategy

### P1 Risks

- supplement generation overwrites reviewer-edited cases
- source refs are present but not precise enough to support review
- validation only checks schema, not coverage quality
- duplicate or near-duplicate cases accumulate after supplement runs
- reviewers cannot distinguish explicit facts from AI inference

### P1 Acceptance Criteria

- every generated testcase contains source refs or inferred markers
- review page displays evidence clearly enough for human inspection
- testcase revision history is queryable
- supplement generation is additive and does not overwrite reviewed/published cases
- generation output and validation report are persisted and queryable
- reviewers can identify missing scenarios and trigger supplement generation from the platform

### P1 Exit Gate

P1 is complete only when a team can run initial generation, review evidence, trigger supplement generation, and keep the reviewed baseline intact.

---

## 5. P2 Plan

### P2 Objective

Improve the quality and efficiency of generated test cases so the platform becomes cheaper and more accurate to operate at scale.

### P2 Scope

- finer domain skill-package templates per system type
- better rule extraction and ambiguity detection
- scenario coverage scoring
- duplicate-case detection and merge suggestions
- stronger priority classification and risk tagging
- metrics and operator insight for generation effectiveness

### P2 Deliverables

#### Product deliverables

- skill-package comparison and optimization workflow
- coverage and quality dashboard
- review-assist summaries for weak areas

#### Backend deliverables

- scenario coverage analysis service
- duplicate similarity detection
- rule-to-case traceability summaries
- operational metrics for generation tasks

#### AI deliverables

- domain-specific skill packages
- optimized supplement prompts by scenario category
- stronger boundary, exception, permission, and state-transition generation strategies

### P2 Risks

- over-optimizing prompts before source parsing quality is sufficient
- adding too many quality rules and making generation brittle
- skills become too customized and hard to maintain across systems
- metrics exist but do not drive product decisions

### P2 Acceptance Criteria

- duplicate and low-value cases measurably decrease
- coverage of boundary, exception, permission, and state-transition scenarios improves
- review time per generated batch is reduced
- teams can compare skill-package performance and evolve them intentionally

### P2 Exit Gate

P2 is complete only when the platform demonstrates consistent quality improvement rather than just more features.

---

## 6. Recommended Build Order

Recommended engineering order:

1. upload, versioning, parse dispatch
2. parsing and structured metadata
3. skill-package archive and activation
4. generation input switch to `document versions + skill version`
5. generation output persistence
6. review and manual editing
7. source refs and revision history
8. supplement generation
9. quality scoring and optimization

Do not invert this order.

In particular:

- do not heavily optimize prompts before versioned generation input is correct
- do not build advanced dashboards before review and supplement generation work
- do not attempt large-scale skills fine-tuning before the main chain is stable

---

## 7. Team Delivery Suggestion

### Track A: Platform Backend

Own:

- document/version lifecycle
- parsing pipeline
- skill-package models and APIs
- generation persistence
- supplement generation logic

### Track B: Web Frontend

Own:

- document center
- skill-package management
- generation page
- review/evidence page
- supplement-generation interaction

### Track C: AI/Test Design

Own:

- MVP skill-package template
- output schema contract
- generation prompt contract
- supplement prompt strategy
- review checklist and quality rules

Best sequencing:

- P0 requires A + B + C all move together
- P1 is backend-heavy, then UI closure
- P2 is AI/test-design heavy, supported by backend metrics

---

## 8. What Must Not Be Delayed

These items are mandatory early investments, not later polish:

- versioned document input
- versioned skill packages
- binary-safe file persistence
- source refs for generated cases
- additive supplement generation

If any of these are postponed, the platform will look complete but still be hard to trust in real use.

---

## 9. Recommended Milestone Definition

### Milestone M1

Equivalent to P0 completion.

Meaning:

- first usable closed loop is online

### Milestone M2

Equivalent to P1 completion.

Meaning:

- generation is reviewable, traceable, and safely supplementable

### Milestone M3

Equivalent to P2 completion.

Meaning:

- generation quality is improving systematically and skills become operational assets

---

## 10. Final Recommendation

If the target is “mature use”, the right strategy is:

1. build the system first
2. embed a minimum viable skill-package system inside it immediately
3. use real generation and review data to improve skills afterward

The biggest mistake would be spending too much time on prompt optimization before the platform has:

- correct source input
- correct version control
- correct review loop
- correct supplement loop

That path creates demos, not a mature TestOps platform.
