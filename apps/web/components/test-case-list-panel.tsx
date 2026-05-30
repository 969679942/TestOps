"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { TestCaseRecord } from "../lib/workspace-api";
import { copy, labelPriority, statusLabels } from "../lib/copy";
import { StatusBadge } from "./status-badge";

type TestCaseListPanelProps = Readonly<{
  projectId: string;
  testCases: TestCaseRecord[];
  showGeneratedBanner?: boolean;
  importedCount?: number;
}>;

const statusFilters = [
  "all",
  "draft",
  "needs_update",
  "approved",
  "published",
  "rejected",
] as const;

export function TestCaseListPanel({
  projectId,
  testCases,
  showGeneratedBanner = false,
  importedCount = 0,
}: TestCaseListPanelProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");

  const filtered = useMemo(() => {
    return testCases.filter((testCase) => {
      const matchesStatus = status === "all" || testCase.status === status;
      const matchesQuery =
        query.trim().length === 0 ||
        testCase.title.toLowerCase().includes(query.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [query, status, testCases]);

  return (
    <>
      {showGeneratedBanner ? (
        <section className="alert-panel success">
          <h3>{copy.generationComplete}</h3>
          <p>{copy.generationCompleteHint}</p>
        </section>
      ) : null}

      {importedCount > 0 ? (
        <section className="alert-panel success">
          <h3>{copy.importComplete}</h3>
          <p>
            {copy.importCompleteHint}
            {copy.importedBatch(importedCount)}
          </p>
        </section>
      ) : null}

      <div className="list-toolbar">
        <label className="field field-inline">
          <span className="sr-only">{copy.searchLabel}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>

        <label className="field field-inline">
          <span className="sr-only">{copy.statusFilterLabel}</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">{copy.filterAll}</option>
            {statusFilters
              .filter((item) => item !== "all")
              .map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
          </select>
        </label>

        <span className="toolbar-meta">{copy.listCount(filtered.length, testCases.length)}</span>

        <Link className="button-primary" href={`/projects/${projectId}/test-cases/new`}>
          + {copy.newTestCase}
        </Link>
      </div>

      <section className="case-list" aria-label="用例列表">
        {filtered.length === 0 ? (
          <article className="empty-card wide">
            <h3>{testCases.length === 0 ? copy.noTestCases : copy.noMatchingCases}</h3>
            <p>
              {testCases.length === 0 ? copy.noTestCasesHint : copy.adjustFiltersHint}
            </p>
            {testCases.length === 0 ? (
              <div className="inline-actions">
                <Link className="button-primary" href={`/projects/${projectId}/test-cases/new`}>
                  + {copy.newTestCase}
                </Link>
                <Link className="button-secondary" href={`/projects/${projectId}`}>
                  {copy.backToUpload}
                </Link>
              </div>
            ) : null}
          </article>
        ) : (
          filtered.map((testCase) => (
            <Link
              key={testCase.id}
              className="case-list-item"
              href={`/projects/${projectId}/test-cases/${testCase.id}`}
            >
              <div className="case-list-main">
                <h3>{testCase.title}</h3>
                <p>
                  {testCase.module} · {testCase.feature} · {labelPriority(testCase.priority)}
                </p>
              </div>
              <div className="case-list-meta">
                <StatusBadge status={testCase.status} />
                <span>{copy.stepCount(testCase.steps.length)}</span>
                <span className="list-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>
          ))
        )}
      </section>
    </>
  );
}
