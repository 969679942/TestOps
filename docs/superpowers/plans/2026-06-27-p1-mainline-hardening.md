# P1 Mainline Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the web API boundary and complete the document-to-skill-to-generation P1 workflow so the platform reliably supports document upload, skill version selection, and incremental AI case supplementation.

**Architecture:** Keep the existing UI structure stable while collapsing old and new API contracts behind one compatibility boundary. Extend the generation contract with explicit skill archive data and supplement context so uploaded documents, selected skill versions, and existing case gaps stay traceable through each generation task.

**Tech Stack:** Next.js App Router, React, TypeScript, FastAPI, SQLAlchemy, pytest, Vitest

---

### Scope

- [ ] Unify the frontend boundary by making `apps/web/lib/workspace-api.ts` a compatibility facade over `apps/web/lib/api.ts`.
- [ ] Extend document + skill package modeling to support archive/storage URI and richer generation metadata.
- [ ] Extend generation tasks with supplement context from existing test cases.
- [ ] Improve the upload/generation UI so selected documents flow directly into generation with better defaults.
- [ ] Verify web, API, and worker suites after each change set.
