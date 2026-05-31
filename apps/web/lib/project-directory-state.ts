import type {
  ProjectRecord,
  ProjectStatus,
  ProjectSummaryRecord,
} from "./workspace-api";

export function toProjectSummaryRecord(project: ProjectRecord): ProjectSummaryRecord {
  return {
    ...project,
    documentCount: 0,
    testCaseCount: 0,
    publishedCount: 0,
  };
}

export function prependProject(
  items: ProjectSummaryRecord[],
  project: ProjectSummaryRecord,
): ProjectSummaryRecord[] {
  return [project, ...items.filter((item) => item.id !== project.id)];
}

export function moveProjectBetweenLists(
  activeItems: ProjectSummaryRecord[],
  archivedItems: ProjectSummaryRecord[],
  projectId: string,
  nextStatus: ProjectStatus,
): {
  activeItems: ProjectSummaryRecord[];
  archivedItems: ProjectSummaryRecord[];
} {
  if (nextStatus === "archived") {
    const moved = activeItems.find((project) => project.id === projectId);
    if (!moved) {
      return { activeItems, archivedItems };
    }

    return {
      activeItems: activeItems.filter((project) => project.id !== projectId),
      archivedItems: [...archivedItems, { ...moved, status: "archived" }],
    };
  }

  const moved = archivedItems.find((project) => project.id === projectId);
  if (!moved) {
    return { activeItems, archivedItems };
  }

  return {
    activeItems: [...activeItems, { ...moved, status: "active" }],
    archivedItems: archivedItems.filter((project) => project.id !== projectId),
  };
}
