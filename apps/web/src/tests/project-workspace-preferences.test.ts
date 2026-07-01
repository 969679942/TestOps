import { describe, expect, it } from "vitest";

import {
  createDefaultWorkspacePreferences,
  removeProjectFromPreferences,
  toggleFavoriteProject,
  trackRecentProject,
} from "../../lib/project-workspace-preferences";

describe("project workspace preferences", () => {
  it("tracks recently opened projects with newest first and a small cap", () => {
    let preferences = createDefaultWorkspacePreferences();

    for (let index = 1; index <= 9; index += 1) {
      preferences = trackRecentProject(preferences, String(index));
    }
    preferences = trackRecentProject(preferences, "4");

    expect(preferences.recentProjectIds).toEqual(["4", "9", "8", "7", "6", "5"]);
  });

  it("toggles favorite projects without duplicating ids", () => {
    let preferences = createDefaultWorkspacePreferences();

    preferences = toggleFavoriteProject(preferences, "11");
    preferences = toggleFavoriteProject(preferences, "11");
    preferences = toggleFavoriteProject(preferences, "12");

    expect(preferences.favoriteProjectIds).toEqual(["12"]);
  });

  it("removes deleted projects from recent and favorite preferences", () => {
    let preferences = createDefaultWorkspacePreferences();

    preferences = trackRecentProject(preferences, "11");
    preferences = trackRecentProject(preferences, "12");
    preferences = toggleFavoriteProject(preferences, "11");
    preferences = toggleFavoriteProject(preferences, "12");

    expect(removeProjectFromPreferences(preferences, "12")).toEqual({
      recentProjectIds: ["11"],
      favoriteProjectIds: ["11"],
    });
  });
});
