"use client";

import { copy } from "../lib/copy";
import type { TestCaseDirectoryTreeNode } from "../lib/test-case-directory-utils";

type TestCaseDirectoryTreeProps = Readonly<{
  directories: TestCaseDirectoryTreeNode[];
  selectedDirectoryId?: string | null;
  onSelectDirectory?: (directoryId: string | null) => void;
  unclassifiedCount?: number;
}>;

export function TestCaseDirectoryTree({
  directories,
  selectedDirectoryId = null,
  onSelectDirectory,
  unclassifiedCount = 0,
}: TestCaseDirectoryTreeProps) {
  return (
    <aside className="case-directory-tree" aria-label="测试用例目录">
      <div className="case-directory-tree-header">
        <div>
          <span className="eyebrow">测试特性目录</span>
          <h3>目录筛选</h3>
        </div>
        <p className="toolbar-meta">按目录快速聚焦用例范围。</p>
      </div>

      <div className="case-directory-tree-search">
        <input aria-label={copy.searchLabel} placeholder="搜索目录名称" />
      </div>

      <div className="case-directory-tree-list">
        <button
          className={`directory-tree-item ${selectedDirectoryId === null ? "is-selected" : ""}`}
          type="button"
          aria-current={selectedDirectoryId === null}
          onClick={() => onSelectDirectory?.(null)}
        >
          <span className="directory-tree-label">全部用例</span>
          <span className="directory-tree-count">
            {directories.reduce((sum, directory) => sum + directory.count, 0) + unclassifiedCount}
          </span>
        </button>

        {directories.map((directory) => (
          <div key={directory.id} className="directory-tree-group">
            <button
              className={`directory-tree-item ${selectedDirectoryId === directory.id ? "is-selected" : ""}`}
              type="button"
              aria-current={selectedDirectoryId === directory.id}
              onClick={() => onSelectDirectory?.(directory.id)}
            >
              <span className="directory-tree-label">{directory.name}</span>
              <span className="directory-tree-count">{directory.count}</span>
            </button>

            {directory.children.length > 0 ? (
              <div className="directory-tree-children">
                {directory.children.map((child) => (
                  <button
                    key={child.id}
                    className={`directory-tree-item is-child ${selectedDirectoryId === child.id ? "is-selected" : ""}`}
                    type="button"
                    aria-current={selectedDirectoryId === child.id}
                    onClick={() => onSelectDirectory?.(child.id)}
                  >
                    <span className="directory-tree-label">{child.name}</span>
                    <span className="directory-tree-count">{child.count}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <button
          className={`directory-tree-item ${selectedDirectoryId === "unclassified" ? "is-selected" : ""}`}
          type="button"
          aria-current={selectedDirectoryId === "unclassified"}
          onClick={() => onSelectDirectory?.("unclassified")}
        >
          <span className="directory-tree-label">未分类</span>
          <span className="directory-tree-count">{unclassifiedCount}</span>
        </button>
      </div>
    </aside>
  );
}
