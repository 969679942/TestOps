"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  createTestCase,
  updateTestCase,
  type TestCaseDirectoryRecord,
  type TestCaseRecord,
} from "../lib/workspace-api";
import {
  createEmptyTestCaseDraft,
  draftFromTestCase,
  serializeDraftForApi,
  type TestCaseDraft,
} from "../lib/ui-automation-case";
import { hasFieldErrors, validateTestCaseDraft, type TestCaseFieldErrors } from "../lib/form-validation";
import { FieldLabel } from "./field-label";
import { StatusBadge } from "./status-badge";
import { TestCaseMetadataSidebar } from "./test-case-metadata-sidebar";
import { TestCaseStepTableEditor } from "./test-case-step-table-editor";

type TestCaseComposerProps = Readonly<{
  mode: "create" | "edit";
  projectId: string;
  directories: TestCaseDirectoryRecord[];
  testCase?: TestCaseRecord;
  sidebarFooter?: ReactNode;
}>;

function hydrateDraft(testCase?: TestCaseRecord): TestCaseDraft {
  if (!testCase) return createEmptyTestCaseDraft();
  return draftFromTestCase({
    ...testCase,
    steps: testCase.steps.map((step, index) => ({
      order: step.order ?? index + 1,
      action: step.action ?? "custom",
      target: step.target ?? step.text ?? "",
      locatorHint: step.locatorHint ?? step.locator_hint,
      value: step.value,
      assertion: step.assertion,
      timeoutMs: step.timeoutMs ?? step.timeout_ms,
      text: step.text,
    })),
  });
}

function executionModeOf(draft: TestCaseDraft) {
  return draft.automationFlag ? "automation" : "manual";
}

export function TestCaseComposer({
  mode,
  projectId,
  directories,
  testCase,
  sidebarFooter,
}: TestCaseComposerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<TestCaseDraft>(() => hydrateDraft(testCase));
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<TestCaseFieldErrors>({});
  const [busy, setBusy] = useState(false);

  const isReadOnly = mode === "edit" && testCase?.status === "published";

  useEffect(() => {
    setDraft(hydrateDraft(testCase));
    setFieldErrors({});
  }, [testCase]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function clearFieldErrors(keys: Array<keyof TestCaseFieldErrors>) {
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of keys) {
        delete next[key];
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly) return;
    setToast(null);
    const nextFieldErrors = validateTestCaseDraft(draft);
    setFieldErrors(nextFieldErrors);
    if (hasFieldErrors(nextFieldErrors)) {
      setToast({ type: "error", text: "请完善必填项后再保存。" });
      return;
    }
    setBusy(true);

    try {
      const payload = serializeDraftForApi(draft);

      if (mode === "create") {
        const created = await createTestCase(projectId, payload);
        router.push(`/projects/${projectId}/test-cases/${created.id}`);
        router.refresh();
        return;
      }

      if (!testCase) {
        throw new Error("缺少用例 ID。");
      }

      const saved = await updateTestCase(testCase.id, payload);
      setDraft(hydrateDraft(saved));
      setToast({ type: "success", text: "保存成功。" });
      router.refresh();
    } catch (error) {
      setToast({
        type: "error",
        text: error instanceof ApiError ? error.message : "保存失败。",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="case-editor" onSubmit={handleSubmit} noValidate>
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.text}</div> : null}

      <div className="case-editor-header">
        <div className="case-editor-header-copy">
          <span className="eyebrow">{mode === "create" ? "新建测试用例" : "编辑测试用例"}</span>
          <h2>{mode === "create" ? "在线编写用例" : draft.title || "用例详情"}</h2>
          <p>统一维护用例内容、目录归属与自动化上下文，完成后进入评审与发布流程。</p>
        </div>
        <div className="case-editor-header-actions">
          {testCase ? <StatusBadge status={testCase.status} /> : null}
          {!isReadOnly ? (
            <button className="button-primary" type="submit" disabled={busy}>
              {busy ? "保存中…" : mode === "create" ? "创建用例" : "保存变更"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="case-editor-layout">
        <div className="case-editor-main">
          <section className="data-card case-editor-main-card">
            <label className="field">
              <FieldLabel required>名称</FieldLabel>
              <input
                value={draft.title}
                readOnly={isReadOnly}
                aria-invalid={fieldErrors.title ? "true" : "false"}
                className={fieldErrors.title ? "is-invalid" : ""}
                placeholder="请输入测试用例名称"
                onChange={(event) => {
                  clearFieldErrors(["title"]);
                  setDraft((current) => ({ ...current, title: event.target.value }));
                }}
              />
              {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
            </label>

            <label className="field">
              <FieldLabel>执行方式</FieldLabel>
              <select
                disabled={isReadOnly}
                value={executionModeOf(draft)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    automationFlag: event.target.value === "automation",
                    caseType:
                      event.target.value === "automation"
                        ? current.caseType === "functional"
                          ? "ui_automation"
                          : current.caseType
                        : current.caseType === "ui_automation"
                          ? "functional"
                          : current.caseType,
                  }))
                }
              >
                <option value="manual">手工测试</option>
                <option value="automation">UI 自动化</option>
              </select>
            </label>

            <label className="field">
              <FieldLabel required>描述</FieldLabel>
              <textarea
                rows={4}
                readOnly={isReadOnly}
                aria-invalid={fieldErrors.feature ? "true" : "false"}
                className={fieldErrors.feature ? "is-invalid" : ""}
                placeholder="请输入用例目标或功能描述"
                value={draft.feature}
                onChange={(event) => {
                  clearFieldErrors(["feature"]);
                  setDraft((current) => ({ ...current, feature: event.target.value }));
                }}
              />
              {fieldErrors.feature ? <span className="field-error">{fieldErrors.feature}</span> : null}
            </label>

            <label className="field">
              <FieldLabel>前置条件</FieldLabel>
              <textarea
                rows={4}
                readOnly={isReadOnly}
                placeholder="每行填写一条前置条件"
                value={draft.preconditions.join("\n")}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    preconditions: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </label>
          </section>

          <section className="data-card case-editor-main-card">
            <TestCaseStepTableEditor
              steps={draft.steps}
              expectedResults={draft.expectedResults}
              readOnly={isReadOnly}
              stepErrorIndexes={fieldErrors.stepTargetIndexes}
              expectedResultErrorIndexes={fieldErrors.expectedResultIndexes}
              onChange={({ steps, expectedResults }) =>
                {
                  clearFieldErrors(["steps", "expectedResults", "stepTargetIndexes", "expectedResultIndexes"]);
                  setDraft((current) => ({
                    ...current,
                    steps,
                    expectedResults,
                  }));
                }
              }
            />
          </section>

          <section className="data-card case-editor-main-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">自动化上下文</span>
                <h3>脚本生成辅助信息</h3>
              </div>
              <p>保留当前自动化生成所需的环境、入口与收尾信息，不挤占主编辑区。</p>
            </div>

            <div className="meta-grid">
              <label className="field">
                <span>框架</span>
                <select
                  disabled={isReadOnly}
                  value={draft.uiContext.framework}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      uiContext: { ...current.uiContext, framework: event.target.value },
                    }))
                  }
                >
                  <option value="playwright">Playwright</option>
                  <option value="selenium">Selenium</option>
                  <option value="cypress">Cypress</option>
                </select>
              </label>

              <label className="field">
                <span>浏览器</span>
                <select
                  disabled={isReadOnly}
                  value={draft.uiContext.browser}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      uiContext: { ...current.uiContext, browser: event.target.value },
                    }))
                  }
                >
                  <option value="chromium">Chromium</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">WebKit</option>
                </select>
              </label>

              <label className="field">
                <span>基础 URL</span>
                <input
                  value={draft.uiContext.baseUrl}
                  readOnly={isReadOnly}
                  placeholder="https://app.example.com"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      uiContext: { ...current.uiContext, baseUrl: event.target.value },
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>入口路径</span>
                <input
                  value={draft.uiContext.entryPath}
                  readOnly={isReadOnly}
                  placeholder="/login"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      uiContext: { ...current.uiContext, entryPath: event.target.value },
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>就绪选择器</span>
                <input
                  value={draft.uiContext.entryReadySelector}
                  readOnly={isReadOnly}
                  placeholder="[data-testid='login-form']"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      uiContext: {
                        ...current.uiContext,
                        entryReadySelector: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>视口</span>
                <input
                  value={`${draft.uiContext.viewport.width} x ${draft.uiContext.viewport.height}`}
                  readOnly={isReadOnly}
                  placeholder="1280 x 720"
                  onChange={(event) => {
                    const [widthRaw, heightRaw] = event.target.value
                      .split("x")
                      .map((item) => item.trim());
                    const width = Number(widthRaw);
                    const height = Number(heightRaw);
                    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
                    setDraft((current) => ({
                      ...current,
                      uiContext: {
                        ...current.uiContext,
                        viewport: { width, height },
                      },
                    }));
                  }}
                />
              </label>
            </div>

            <label className="field">
              <span>测试数据</span>
              <textarea
                rows={4}
                readOnly={isReadOnly}
                placeholder='每行使用 key=value，例如 username=tester'
                value={Object.entries(draft.uiContext.testData)
                  .map(([key, value]) => `${key}=${value}`)
                  .join("\n")}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    uiContext: {
                      ...current.uiContext,
                      testData: Object.fromEntries(
                        event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item) => {
                            const [key, ...rest] = item.split("=");
                            return [key.trim(), rest.join("=").trim()];
                          })
                          .filter(([key]) => key.length > 0),
                      ),
                    },
                  }))
                }
              />
            </label>

            <label className="field">
              <span>AI 生成说明</span>
              <textarea
                rows={3}
                readOnly={isReadOnly}
                placeholder="补充脚本生成偏好、定位约定或收尾要求"
                value={draft.automationNotes ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    automationNotes: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>清理 / 收尾</span>
              <textarea
                rows={3}
                readOnly={isReadOnly}
                placeholder="例如退出登录、清理会话或回收测试数据"
                value={draft.uiContext.teardown}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    uiContext: { ...current.uiContext, teardown: event.target.value },
                  }))
                }
              />
            </label>
          </section>
        </div>

        <div className="case-editor-side-rail">
          <TestCaseMetadataSidebar
            caseId={testCase?.id}
            draft={draft}
            directories={directories}
            readOnly={isReadOnly}
            invalidFields={{
              caseType: Boolean(fieldErrors.caseType),
              priority: Boolean(fieldErrors.priority),
              module: Boolean(fieldErrors.module),
            }}
            onChange={(patch) => {
              const clearKeys: Array<keyof TestCaseFieldErrors> = [];
              if (patch.caseType !== undefined) clearKeys.push("caseType");
              if (patch.priority !== undefined) clearKeys.push("priority");
              if (patch.module !== undefined) clearKeys.push("module");
              if (clearKeys.length > 0) {
                clearFieldErrors(clearKeys);
              }
              setDraft((current) => ({
                ...current,
                ...patch,
              }));
            }}
          />
          {sidebarFooter}
        </div>
      </div>
    </form>
  );
}
