"use client";

import { PAGE_SIZE_OPTIONS } from "../lib/list-session-state";

type TablePaginationProps = Readonly<{
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}>;

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalItems <= 10 && totalPages <= 1) {
    return null;
  }

  return (
    <div className="table-pagination">
      <label className="field field-inline table-pagination-size">
        <span>每页</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>条</span>
      </label>

      <div className="table-pagination-nav">
        <button
          className="button-ghost"
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </button>
        <span className="table-pagination-meta">
          第 {page} / {totalPages} 页，共 {totalItems} 条
        </span>
        <button
          className="button-ghost"
          disabled={page >= totalPages}
          type="button"
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
