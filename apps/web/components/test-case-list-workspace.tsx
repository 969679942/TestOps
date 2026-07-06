"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { copy, statusLabels } from "../lib/copy";
import {
  loadTestCaseListFilters,
  paginateItems,
  saveTestCaseListFilters,
} from "../lib/list-session-state";
import type { TestCaseDirectoryTreeNode } from "../lib/test-case-directory-utils";
import type { TestCaseRecord } from "../lib/workspace-api";
import { QueryTrail } from "./query-trail";
import { TablePagination } from "./table-pagination";
import { TestCaseDirectoryTree } from "./test-case-directory-tree";
import {
  formatStatusSummary,
  summarizeTestCaseStatuses,
  TestCaseResultsTable,
} from "./test-case-results-table";

type TestCaseListWorkspaceProps = Readonly<{
  projectId: string;
  testCases: TestCaseRecord[];
  directories: TestCaseDirectoryTreeNode[];
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

function collectDirectoryScopeIds(directory: TestCaseDirectoryTreeNode): string[] {
  return [directory.id, ...directory.children.flatMap(collectDirectoryScopeIds)];
}

function resolveDirectoryScopeIds(
  directories: TestCaseDirectoryTreeNode[],
  selectedDirectoryId: string | null,
) {
  if (!selectedDirectoryId || selectedDirectoryId === "unclassified") {
    return [];
  }

  for (const directory of directories) {
    if (directory.id === selectedDirectoryId) {
      return collectDirectoryScopeIds(directory);
    }
    const child = directory.children.find((item) => item.id === selectedDirectoryId);
    if (child) {
      return [child.id];
    }
  }

  return [];
}

function findDirectoryName(
  directories: TestCaseDirectoryTreeNode[],
  selectedDirectoryId: string | null,
) {
  if (!selectedDirectoryId) {
    return null;
  }
  if (selectedDirectoryId === "unclassified") {
    return "未分类";
  }

  for (const directory of directories) {
    if (directory.id === selectedDirectoryId) {
      return directory.name;
    }
    const child = directory.children.find((item) => item.id === selectedDirectoryId);
    if (child) {
      return child.name;
    }
  }

  return null;
}

export function TestCaseListWorkspace({
  projectId,
  testCases,
  directories,
  showGeneratedBanner = false,
  importedCount = 0,
}: TestCaseListWorkspaceProps) {
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const resetGuard = useRef(0);

  useEffect(() => {
    const saved = loadTestCaseListFilters(projectId);
    setQuery(saved.query);
    setStatus((saved.status as (typeof statusFilters)[number]) || "all");
    setSelectedDirectoryId(saved.selectedDirectoryId);
    setPage(saved.page);
    setPageSize(saved.pageSize);
    setHydrated(true);
  }, [projectId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveTestCaseListFilters(projectId, {
      query,
      status,
      selectedDirectoryId,
      page,
      pageSize,
    });
  }, [hydrated, page, pageSize, projectId, query, selectedDirectoryId, status]);

  const hasActiveFilters =
    query.trim().length > 0 || status !== "all" || selectedDirectoryId !== null;

  const unclassifiedCount = testCases.filter((item) => item.directoryId === null).length;
  const selectedScopeIds = useMemo(
    () => resolveDirectoryScopeIds(directories, selectedDirectoryId),
    [directories, selectedDirectoryId],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return testCases.filter((testCase) => {
      const matchesStatus = status === "all" || testCase.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        testCase.title.toLowerCase().includes(normalizedQuery) ||
        testCase.feature.toLowerCase().includes(normalizedQuery) ||
        testCase.module.toLowerCase().includes(normalizedQuery);
      const matchesDirectory =
        selectedDirectoryId === null
          ? true
          : selectedDirectoryId === "unclassified"
            ? testCase.directoryId === null
            : selectedScopeIds.includes(testCase.directoryId ?? "");

      return matchesStatus && matchesQuery && matchesDirectory;
    });
  }, [query, selectedDirectoryId, selectedScopeIds, status, testCases]);

  const paginated = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  const statusSummary = useMemo(
    () => formatStatusSummary(summarizeTestCaseStatuses(filtered)),
    [filtered],
  );

  useEffect(() => {
    setPage(1);
  }, [query, selectedDirectoryId, status]);

  function resetFilters() {
    const now = Date.now();
    if (now - resetGuard.current < 1000) {
      return;
    }
    resetGuard.current = now;
    setQuery("");
    setStatus("all");
    setSelectedDirectoryId(null);
    setPage(1);
  }

  const directoryName = findDirectoryName(directories, selectedDirectoryId);
  const queryTrailItems = [
    status !== "all"
      ? {
          id: "status",
          label: `状态：${statusLabels[status] ?? status}`,
          onRemove: () => setStatus("all"),
        }
      : null,
    query.trim()
      ? {
          id: "query",
          label: `关键词：${query.trim()}`,
          onRemove: () => setQuery(""),
        }
      : null,
    selectedDirectoryId
      ? {
          id: "directory",
          label: `目录：${directoryName ?? selectedDirectoryId}`,
          onRemove: () => setSelectedDirectoryId(null),
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; onRemove: () => void }>;

  return (
    <section className="case-workspace">
      <div className="case-workspace-sidebar">
        <TestCaseDirectoryTree
          directories={directories}
          selectedDirectoryId={selectedDirectoryId}
          onSelectDirectory={setSelectedDirectoryId}
          unclassifiedCount={unclassifiedCount}
        />
      </div>

      <div className="case-workspace-main">
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

        <section className="list-toolbar case-workspace-toolbar">
          <div className="case-workspace-toolbar-left">
            <Link className="button-primary" href={`/projects/${projectId}/test-cases/new`}>
              + 新增
            </Link>
            <div className="case-workspace-flow-actions">
              <Link className="button-secondary" href={`/projects/${projectId}`}>
                上传资料生成
              </Link>
              <Link className="button-secondary" href={`/projects/${projectId}?mode=import`}>
                导入用例
              </Link>
              <Link className="button-secondary" href={`/projects/${projectId}/review`}>
                进入评审
              </Link>
            </div>
          </div>

          <div className="case-workspace-toolbar-right">
            <label className="field field-inline">
              <span>{copy.statusFilterLabel}</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
              >
                <option value="all">全部状态</option>
                {statusFilters
                  .filter((item) => item !== "all")
                  .map((item) => (
                    <option key={item} value={item}>
                      {statusLabels[item]}
                    </option>
                  ))}
              </select>
            </label>

            <label className="field field-inline">
              <span>{copy.searchLabel}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="请输入名称、模块或功能点"
              />
            </label>

            <button
              className="button-ghost"
              disabled={!hasActiveFilters}
              type="button"
              onClick={resetFilters}
            >
              重置
            </button>
          </div>
        </section>

        <QueryTrail items={queryTrailItems} />

        <section className="data-card case-results-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">测试用例</span>
              <h3>用例结果列表</h3>
            </div>
            <p className="toolbar-meta">{copy.listCount(filtered.length, testCases.length)}</p>
          </div>

          {statusSummary ? <p className="list-status-summary">{statusSummary}</p> : null}

          {filtered.length === 0 ? (
            <article className="empty-card wide">
              <h3>{testCases.length === 0 ? copy.noTestCases : copy.noMatchingCases}</h3>
              <p>{testCases.length === 0 ? copy.noTestCasesHint : copy.adjustFiltersHint}</p>
            </article>
          ) : (
            <>
              <TestCaseResultsTable projectId={projectId} items={paginated.items} />
              <TablePagination
                page={paginated.page}
                pageSize={paginated.pageSize}
                totalItems={paginated.totalItems}
                totalPages={paginated.totalPages}
                onPageChange={setPage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  setPage(1);
                }}
              />
            </>
          )}
        </section>
      </div>
    </section>
  );
}
