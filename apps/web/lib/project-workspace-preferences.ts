export type WorkspacePreferences = Readonly<{
  recentProjectIds: string[];
  favoriteProjectIds: string[];
}>;

const RECENT_PROJECT_LIMIT = 6;

export function createDefaultWorkspacePreferences(): WorkspacePreferences {
  return {
    recentProjectIds: [],
    favoriteProjectIds: [],
  };
}

export function trackRecentProject(
  preferences: WorkspacePreferences,
  projectId: string,
): WorkspacePreferences {
  return {
    ...preferences,
    recentProjectIds: [
      projectId,
      ...preferences.recentProjectIds.filter((id) => id !== projectId),
    ].slice(0, RECENT_PROJECT_LIMIT),
  };
}

export function toggleFavoriteProject(
  preferences: WorkspacePreferences,
  projectId: string,
): WorkspacePreferences {
  const alreadyFavorite = preferences.favoriteProjectIds.includes(projectId);

  return {
    ...preferences,
    favoriteProjectIds: alreadyFavorite
      ? preferences.favoriteProjectIds.filter((id) => id !== projectId)
      : [projectId, ...preferences.favoriteProjectIds],
  };
}

export function removeProjectFromPreferences(
  preferences: WorkspacePreferences,
  projectId: string,
): WorkspacePreferences {
  return {
    recentProjectIds: preferences.recentProjectIds.filter((id) => id !== projectId),
    favoriteProjectIds: preferences.favoriteProjectIds.filter((id) => id !== projectId),
  };
}

export function parseWorkspacePreferences(rawValue: string | null): WorkspacePreferences {
  if (!rawValue) {
    return createDefaultWorkspacePreferences();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<WorkspacePreferences>;
    return {
      recentProjectIds: Array.isArray(parsed.recentProjectIds)
        ? parsed.recentProjectIds.filter((value): value is string => typeof value === "string")
        : [],
      favoriteProjectIds: Array.isArray(parsed.favoriteProjectIds)
        ? parsed.favoriteProjectIds.filter((value): value is string => typeof value === "string")
        : [],
    };
  } catch {
    return createDefaultWorkspacePreferences();
  }
}
