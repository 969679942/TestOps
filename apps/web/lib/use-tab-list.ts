"use client";

import { useCallback, useEffect, useRef } from "react";

export function useTabList(
  activeId: string,
  tabIds: string[],
  onChange: (id: string) => void,
) {
  const tablistRef = useRef<HTMLDivElement>(null);

  const focusTab = useCallback((id: string) => {
    const tab = tablistRef.current?.querySelector<HTMLElement>(`[data-tab-id="${id}"]`);
    tab?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!tablistRef.current?.contains(event.target as Node)) {
        return;
      }

      const currentIndex = tabIds.indexOf(activeId);
      if (currentIndex === -1) {
        return;
      }

      let nextIndex = currentIndex;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % tabIds.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
      } else if (event.key === "Home") {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === "End") {
        event.preventDefault();
        nextIndex = tabIds.length - 1;
      } else {
        return;
      }

      const nextId = tabIds[nextIndex];
      onChange(nextId);
      focusTab(nextId);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeId, focusTab, onChange, tabIds]);

  return tablistRef;
}
