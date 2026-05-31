"use client";

import { useCallback, useState } from "react";

import { copy } from "../lib/copy";
import type { ProjectDocumentRecord } from "../lib/workspace-api";
import { useTabList } from "../lib/use-tab-list";
import { DocumentUploadPanel } from "./document-upload-panel";
import { TestCaseImportPanel } from "./test-case-import-panel";

type WorkspaceMode = "generate" | "import";

type ProjectWorkspaceTabsProps = Readonly<{
  projectId: string;
  documents: ProjectDocumentRecord[];
  defaultProvider?: string;
  onGeneratingChange?: (generating: boolean) => void;
  projectStatus?: "active" | "archived";
}>;

const workspaceModes: WorkspaceMode[] = ["generate", "import"];

export function ProjectWorkspaceTabs({
  projectId,
  documents,
  defaultProvider,
  onGeneratingChange,
  projectStatus = "active",
}: ProjectWorkspaceTabsProps) {
  const [mode, setMode] = useState<WorkspaceMode>("generate");
  const handleModeChange = useCallback((id: string) => {
    setMode(id as WorkspaceMode);
  }, []);
  const tablistRef = useTabList(mode, workspaceModes, handleModeChange);
  const archived = projectStatus === "archived";

  return (
    <section className="workspace-tabs" aria-label="用例来源">
      <div className="workspace-tabs-header">
        <div>
          <span className="eyebrow">工作区模式</span>
          <h3>选择用例来源</h3>
        </div>
        <p className="workspace-mode-hint">
          {mode === "generate" ? copy.modeGenerateHint : copy.modeImportHint}
        </p>
      </div>

      {archived ? (
        <div className="archived-action-lock" role="status">
          {copy.archivedProjectActionHint}
        </div>
      ) : (
        <>
          <div
            ref={tablistRef}
            className="workspace-mode-tabs"
            role="tablist"
            aria-label={copy.workspaceModeTabLabel}
          >
            <button
              type="button"
              role="tab"
              data-tab-id="generate"
              aria-selected={mode === "generate"}
              aria-controls="workspace-panel-generate"
              id="workspace-tab-generate"
              className={`tab-button ${mode === "generate" ? "is-active" : ""}`}
              onClick={() => setMode("generate")}
            >
              {copy.modeGenerate}
            </button>
            <button
              type="button"
              role="tab"
              data-tab-id="import"
              aria-selected={mode === "import"}
              aria-controls="workspace-panel-import"
              id="workspace-tab-import"
              className={`tab-button ${mode === "import" ? "is-active" : ""}`}
              onClick={() => setMode("import")}
            >
              {copy.modeImport}
            </button>
          </div>

          {mode === "generate" ? (
            <div
              className="workspace-panel-frame"
              id="workspace-panel-generate"
              role="tabpanel"
              aria-labelledby="workspace-tab-generate"
            >
              <DocumentUploadPanel
                projectId={projectId}
                documents={documents}
                defaultProvider={defaultProvider}
                onGeneratingChange={onGeneratingChange}
              />
            </div>
          ) : (
            <div
              className="workspace-panel-frame"
              id="workspace-panel-import"
              role="tabpanel"
              aria-labelledby="workspace-tab-import"
            >
              <TestCaseImportPanel projectId={projectId} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
