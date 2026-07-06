"use client";

import { useCallback, useState } from "react";

import { useTabList } from "../lib/use-tab-list";

export type SkillDetailTab = "preview" | "versions" | "bindings" | "eval" | "settings";

type SkillDetailTabsProps = Readonly<{
  preview: React.ReactNode;
  versions: React.ReactNode;
  bindings: React.ReactNode;
  evalPanel: React.ReactNode;
  settings: React.ReactNode;
  defaultTab?: SkillDetailTab;
}>;

const tabIds: SkillDetailTab[] = ["preview", "versions", "bindings", "eval", "settings"];

const tabLabels: Record<SkillDetailTab, string> = {
  preview: "内容预览",
  versions: "版本历史",
  bindings: "项目绑定",
  eval: "效果概览",
  settings: "设置",
};

export function SkillDetailTabs({
  preview,
  versions,
  bindings,
  evalPanel,
  settings,
  defaultTab = "preview",
}: SkillDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<SkillDetailTab>(defaultTab);
  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id as SkillDetailTab);
  }, []);
  const tablistRef = useTabList(activeTab, tabIds, handleTabChange);

  const panels: Record<SkillDetailTab, React.ReactNode> = {
    preview,
    versions,
    bindings,
    eval: evalPanel,
    settings,
  };

  return (
    <section className="skill-detail-tabs">
      <div
        ref={tablistRef}
        className="skill-detail-tablist"
        role="tablist"
        aria-label="Skill 详情分区"
      >
        {tabIds.map((tabId) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            data-tab-id={tabId}
            aria-selected={activeTab === tabId}
            aria-controls={`skill-detail-panel-${tabId}`}
            id={`skill-detail-tab-${tabId}`}
            className={`tab-button ${activeTab === tabId ? "is-active" : ""}`}
            onClick={() => setActiveTab(tabId)}
          >
            {tabLabels[tabId]}
          </button>
        ))}
      </div>

      {tabIds.map((tabId) => (
        <div
          key={tabId}
          role="tabpanel"
          id={`skill-detail-panel-${tabId}`}
          aria-labelledby={`skill-detail-tab-${tabId}`}
          hidden={activeTab !== tabId}
          className="skill-detail-tabpanel"
        >
          {panels[tabId]}
        </div>
      ))}
    </section>
  );
}
