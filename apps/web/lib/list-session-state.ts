export type TestCaseListFilters = {
  query: string;
  status: string;
  selectedDirectoryId: string | null;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 20;

export function defaultTestCaseListFilters(): TestCaseListFilters {
  return {
    query: "",
    status: "all",
    selectedDirectoryId: null,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function loadTestCaseListFilters(projectId: string): TestCaseListFilters {
  if (typeof window === "undefined") {
    return defaultTestCaseListFilters();
  }

  try {
    const raw = window.sessionStorage.getItem(`testops.list-filters.${projectId}`);
    if (!raw) {
      return defaultTestCaseListFilters();
    }
    const parsed = JSON.parse(raw) as Partial<TestCaseListFilters>;
    return { ...defaultTestCaseListFilters(), ...parsed };
  } catch {
    return defaultTestCaseListFilters();
  }
}

export function saveTestCaseListFilters(projectId: string, filters: TestCaseListFilters) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(`testops.list-filters.${projectId}`, JSON.stringify(filters));
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalPages,
    totalItems: items.length,
  };
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
