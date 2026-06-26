"use client";

import { FieldLabel } from "./field-label";
import type { TestCaseDraft } from "../lib/ui-automation-case";
import type { TestCaseDirectoryRecord } from "../lib/workspace-api";

type TestCaseMetadataSidebarProps = Readonly<{
  caseId?: string;
  draft: TestCaseDraft;
  directories: TestCaseDirectoryRecord[];
  readOnly: boolean;
  invalidFields?: {
    caseType?: boolean;
    priority?: boolean;
    module?: boolean;
  };
  onChange: (patch: Partial<TestCaseDraft>) => void;
}>;

const caseTypeOptions = [
  { value: "functional", label: "功能测试" },
  { value: "ui_automation", label: "UI 自动化" },
  { value: "regression", label: "回归测试" },
  { value: "smoke", label: "冒烟测试" },
  { value: "negative", label: "异常测试" },
];

const priorityOptions = [
  { value: "high", label: "P1" },
  { value: "medium", label: "P2" },
  { value: "low", label: "P3" },
];

function formatCaseCode(caseId?: string) {
  if (!caseId) return "保存后生成";
  return /^\\d+$/.test(caseId) ? `TC-${caseId.padStart(4, "0")}` : `TC-${caseId}`;
}

function resolveRootId(
  directories: TestCaseDirectoryRecord[],
  directoryId: string | null,
): string {
  if (!directoryId) return "";
  const root = directories.find(
    (item) => item.id === directoryId || item.children.some((child) => child.id === directoryId),
  );
  return root?.id ?? "";
}

export function TestCaseMetadataSidebar({
  caseId,
  draft,
  directories,
  readOnly,
  invalidFields,
  onChange,
}: TestCaseMetadataSidebarProps) {
  const rootId = resolveRootId(directories, draft.directoryId);
  const selectedRoot = directories.find((item) => item.id === rootId) ?? null;
  const childOptions = selectedRoot?.children ?? [];
  const selectedChildId =
    childOptions.find((item) => item.id === draft.directoryId)?.id ?? "";

  return (
    <aside className="case-editor-sidebar">
      <section className="case-editor-sidebar-card">
        <div className="case-editor-sidebar-header">
          <h3>基本信息</h3>
          <span className="toolbar-meta">管理</span>
        </div>

        <label className="field">
          <span>编号</span>
          <input value={formatCaseCode(caseId)} readOnly />
        </label>

        <label className="field">
          <FieldLabel required>类型</FieldLabel>
          <select
            aria-invalid={invalidFields?.caseType ? "true" : "false"}
            className={invalidFields?.caseType ? "is-invalid" : ""}
            disabled={readOnly}
            value={draft.caseType}
            onChange={(event) => onChange({ caseType: event.target.value })}
          >
            {caseTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <FieldLabel required>用例等级</FieldLabel>
          <select
            aria-invalid={invalidFields?.priority ? "true" : "false"}
            className={invalidFields?.priority ? "is-invalid" : ""}
            disabled={readOnly}
            value={draft.priority}
            onChange={(event) => onChange({ priority: event.target.value })}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>标签</span>
          <input
            value={draft.tags.join(", ")}
            readOnly={readOnly}
            placeholder="请输入标签，使用逗号分隔"
            onChange={(event) =>
              onChange({
                tags: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        <label className="field">
          <FieldLabel required>模块</FieldLabel>
          <input
            aria-invalid={invalidFields?.module ? "true" : "false"}
            className={invalidFields?.module ? "is-invalid" : ""}
            value={draft.module}
            readOnly={readOnly}
            placeholder="请输入模块"
            onChange={(event) => onChange({ module: event.target.value })}
          />
        </label>

        <label className="field">
          <span>版本号</span>
          <input
            value={draft.releaseVersion}
            readOnly={readOnly}
            placeholder="待选择"
            onChange={(event) => onChange({ releaseVersion: event.target.value })}
          />
        </label>

        <label className="field">
          <span>迭代</span>
          <input
            value={draft.iteration}
            readOnly={readOnly}
            placeholder="待选择"
            onChange={(event) => onChange({ iteration: event.target.value })}
          />
        </label>

        <label className="field">
          <span>处理者</span>
          <input
            value={draft.owner}
            readOnly={readOnly}
            placeholder="请分配处理者"
            onChange={(event) => onChange({ owner: event.target.value })}
          />
        </label>

        <div className="field">
          <FieldLabel>归属目录</FieldLabel>
          <div className="directory-select-stack">
            <select
              disabled={readOnly}
              value={rootId}
              onChange={(event) =>
                onChange({ directoryId: event.target.value || null })
              }
            >
              <option value="">请选择一级目录</option>
              {directories.map((directory) => (
                <option key={directory.id} value={directory.id}>
                  {directory.name}
                </option>
              ))}
            </select>
            <select
              disabled={readOnly || !selectedRoot}
              value={selectedChildId}
              onChange={(event) =>
                onChange({
                  directoryId: event.target.value || selectedRoot?.id || null,
                })
              }
            >
              <option value="">请选择二级目录（可选）</option>
              {childOptions.map((directory) => (
                <option key={directory.id} value={directory.id}>
                  {directory.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="field">
          <span>关联需求</span>
          <input
            value={draft.linkedRequirement}
            readOnly={readOnly}
            placeholder="请输入需求链接或编号"
            onChange={(event) => onChange({ linkedRequirement: event.target.value })}
          />
        </label>

        <label className="field">
          <span>附件</span>
          <textarea
            rows={3}
            readOnly={readOnly}
            placeholder="每行一条附件说明或路径"
            value={draft.attachments.join("\n")}
            onChange={(event) =>
              onChange({
                attachments: event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      </section>
    </aside>
  );
}
