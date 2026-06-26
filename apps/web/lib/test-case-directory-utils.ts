import type { TestCaseDirectoryRecord, TestCaseRecord } from "./workspace-api";

export type TestCaseDirectoryTreeNode = {
  id: string;
  projectId: string;
  name: string;
  parentId: string | null;
  count: number;
  children: TestCaseDirectoryTreeNode[];
};

function countCasesForDirectory(
  directory: TestCaseDirectoryRecord,
  directCounts: Map<string, number>,
): number {
  return (
    (directCounts.get(directory.id) ?? 0) +
    directory.children.reduce(
      (sum, child) => sum + countCasesForDirectory(child, directCounts),
      0,
    )
  );
}

function decorateDirectory(
  directory: TestCaseDirectoryRecord,
  directCounts: Map<string, number>,
): TestCaseDirectoryTreeNode {
  return {
    id: directory.id,
    projectId: directory.projectId,
    name: directory.name,
    parentId: directory.parentId,
    count: countCasesForDirectory(directory, directCounts),
    children: directory.children.map((child) => decorateDirectory(child, directCounts)),
  };
}

export function buildDirectoryTree(
  directories: TestCaseDirectoryRecord[],
  testCases: TestCaseRecord[],
): TestCaseDirectoryTreeNode[] {
  const directCounts = new Map<string, number>();

  for (const testCase of testCases) {
    if (!testCase.directoryId) continue;
    directCounts.set(
      testCase.directoryId,
      (directCounts.get(testCase.directoryId) ?? 0) + 1,
    );
  }

  return directories.map((directory) => decorateDirectory(directory, directCounts));
}
