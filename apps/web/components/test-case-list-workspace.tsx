"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { copy, statusLabels } from "../lib/copy";
import type { TestCaseDirectoryTreeNode } from "../lib/test-case-directory-utils";
import type { TestCaseRecord } from "../lib/workspace-api";
import { TestCaseDirectoryTree } from "./test-case-directory-tree";
import { TestCaseResultsTable } from "./test-case-results-table";

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

export function TestCaseListWorkspace({
  projectId,
  testCases,
  directories,
  showGeneratedBanner = false,
  importedCount = 0,
}: TestCaseListWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(null);
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

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setSelectedDirectoryId(null);
  }

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
              + 新建用例
            </Link>
            <div className="case-workspace-flow-actions">
              <Link className="button-secondary" href={`/projects/${projectId}`}>
                上传资料生成
              </Link>
              <Link className="button-secondary" href={`/projects/${projectId}?mode=import`}>
                导入用例
              </Link>
              <Link className="button-secondary" href={`/projects/${projectId}/review`}>
                预览评审
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

        <section className="data-card case-results-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">测试用例</span>
              <h3>用例结果列表</h3>
            </div>
            <p className="toolbar-meta">{copy.listCount(filtered.length, testCases.length)}</p>
          </div>

          {filtered.length === 0 ? (
            <article className="empty-card wide">
              <h3>{testCases.length === 0 ? copy.noTestCases : copy.noMatchingCases}</h3>
              <p>{testCases.length === 0 ? copy.noTestCasesHint : copy.adjustFiltersHint}</p>
            </article>
          ) : (
            <TestCaseResultsTable projectId={projectId} items={filtered} />
          )}
        </section>
      </div>
    </section>
  );
}
