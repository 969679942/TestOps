"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ApiError,
  createTestCase,
  updateTestCase,
  type TestCaseRecord,
} from "../lib/workspace-api";
import { copy, priorityLabels } from "../lib/copy";
import {
  createEmptyTestCaseDraft,
  draftFromTestCase,
  serializeDraftForApi,
  UI_STEP_ACTIONS,
  type TestCaseDraft,
  type UIAutomationStep,
} from "../lib/ui-automation-case";
import { StatusBadge } from "./status-badge";

type TestCaseComposerProps = Readonly<{
  mode: "create" | "edit";
  projectId: string;
  testCase?: TestCaseRecord;
}>;

function StringListEditor({
  label,
  items,
  readOnly,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  readOnly: boolean;
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <section className="string-list-editor">
      <div className="string-list-header">
        <span className="eyebrow">{label}</span>
        {!readOnly ? (
          <button
            className="button-ghost"
            type="button"
            onClick={() => onChange([...items, ""])}
          >
            + 添加
          </button>
        ) : null}
      </div>
      <div className="string-list-items">
        {items.length === 0 ? <p className="helper-text">暂无内容</p> : null}
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="string-list-row">
            <input
              value={item}
              readOnly={readOnly}
              placeholder={placeholder}
              onChange={(event) =>
                onChange(items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)))
              }
            />
            {!readOnly ? (
              <button
                className="button-ghost"
                type="button"
                aria-label="删除"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                删除
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function TestDataEditor({
  testData,
  readOnly,
  onChange,
}: {
  testData: Record<string, string>;
  readOnly: boolean;
  onChange: (testData: Record<string, string>) => void;
}) {
  const entries = Object.entries(testData);

  function updateEntry(index: number, key: string, value: string) {
    const next = { ...testData };
    const oldKey = entries[index]?.[0];
    if (oldKey && oldKey !== key) {
      delete next[oldKey];
    }
    next[key] = value;
    onChange(next);
  }

  function removeEntry(index: number) {
    const next = { ...testData };
    const key = entries[index]?.[0];
    if (key) delete next[key];
    onChange(next);
  }

  return (
    <section className="test-data-editor">
      <div className="string-list-header">
        <span className="eyebrow">{copy.testData}</span>
        {!readOnly ? (
          <button
            className="button-ghost"
            type="button"
            onClick={() => onChange({ ...testData, [`var_${entries.length + 1}`]: "" })}
          >
            + 添加变量
          </button>
        ) : null}
      </div>
      <div className="test-data-grid">
        {entries.length === 0 ? <p className="helper-text">可在步骤中用 {`{{test_data.变量名}}`} 引用</p> : null}
        {entries.map(([key, value], index) => (
          <div key={`${key}-${index}`} className="test-data-row">
            <input
              value={key}
              readOnly={readOnly}
              placeholder="变量名"
              onChange={(event) => updateEntry(index, event.target.value, value)}
            />
            <input
              value={value}
              readOnly={readOnly}
              placeholder="值或 {{vault:secret}}"
              onChange={(event) => updateEntry(index, key, event.target.value)}
            />
            {!readOnly ? (
              <button className="button-ghost" type="button" onClick={() => removeEntry(index)}>
                删除
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TestCaseComposer({ mode, projectId, testCase }: TestCaseComposerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<TestCaseDraft>(() =>
    testCase ? draftFromTestCase({
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
    }) : createEmptyTestCaseDraft(),
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const isReadOnly = mode === "edit" && testCase?.status === "published";

  useEffect(() => {
    if (testCase) {
      setDraft(
        draftFromTestCase({
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
        }),
      );
    }
  }, [testCase]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateStep(index: number, patch: Partial<UIAutomationStep>) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch, order: index + 1 } : step,
      ),
    }));
  }

  function addStep() {
    setDraft((current) => ({
      ...current,
      steps: [
        ...current.steps,
        {
          order: current.steps.length + 1,
          action: "click",
          target: "",
          locatorHint: "",
          value: "",
          assertion: "",
        },
      ],
    }));
  }

  function removeStep(index: number) {
    setDraft((current) => ({
      ...current,
      steps: current.steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, order: stepIndex + 1 })),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly) return;

    setBusy(true);
    setToast(null);

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
      setDraft(
        draftFromTestCase({
          ...saved,
          steps: saved.steps.map((step, index) => ({
            order: step.order ?? index + 1,
            action: step.action ?? "custom",
            target: step.target ?? step.text ?? "",
            locatorHint: step.locatorHint ?? step.locator_hint,
            value: step.value,
            assertion: step.assertion,
            timeoutMs: step.timeoutMs ?? step.timeout_ms,
            text: step.text,
          })),
        }),
      );
      setToast({ type: "success", text: copy.saved });
      router.refresh();
    } catch (saveError) {
      setToast({
        type: "error",
        text: saveError instanceof ApiError ? saveError.message : "保存失败。",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="case-editor" onSubmit={handleSubmit}>
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.text}</div> : null}

      <div className="case-editor-header">
        <div>
          <span className="eyebrow">{mode === "create" ? copy.composeTitle : "用例内容"}</span>
          {testCase ? <StatusBadge status={testCase.status} /> : null}
        </div>
        {!isReadOnly ? (
          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? copy.saving : mode === "create" ? copy.createTestCase : copy.save}
          </button>
        ) : null}
      </div>

      <label className="field">
        <span>用例标题</span>
        <input
          required
          value={draft.title}
          readOnly={isReadOnly}
          placeholder="使用有效账号登录并进入首页"
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>

      <div className="meta-grid">
        <label className="field">
          <span>{copy.module}</span>
          <input
            required
            value={draft.module}
            readOnly={isReadOnly}
            onChange={(event) => setDraft((current) => ({ ...current, module: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>{copy.feature}</span>
          <input
            required
            value={draft.feature}
            readOnly={isReadOnly}
            onChange={(event) => setDraft((current) => ({ ...current, feature: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>{copy.priority}</span>
          <select
            disabled={isReadOnly}
            value={draft.priority}
            onChange={(event) =>
              setDraft((current) => ({ ...current, priority: event.target.value }))
            }
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>{copy.tags}</span>
        <input
          value={draft.tags.join(", ")}
          readOnly={isReadOnly}
          placeholder="smoke, login, regression"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              tags: event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            }))
          }
        />
      </label>

      <section className="composer-section">
        <h4>{copy.environmentSection}</h4>
        <div className="meta-grid">
          <label className="field">
            <span>{copy.framework}</span>
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
            <span>{copy.browser}</span>
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
            <span>{copy.baseUrl}</span>
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
        </div>
        <div className="meta-grid">
          <label className="field">
            <span>{copy.entryPath}</span>
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
            <span>{copy.entryReadySelector}</span>
            <input
              value={draft.uiContext.entryReadySelector}
              readOnly={isReadOnly}
              placeholder="[data-testid='login-form']"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  uiContext: { ...current.uiContext, entryReadySelector: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>{copy.viewport}</span>
            <input
              value={`${draft.uiContext.viewport.width} x ${draft.uiContext.viewport.height}`}
              readOnly={isReadOnly}
              placeholder="1280 x 720"
              onChange={(event) => {
                const [widthRaw, heightRaw] = event.target.value.split("x").map((item) => item.trim());
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
      </section>

      <TestDataEditor
        testData={draft.uiContext.testData}
        readOnly={isReadOnly}
        onChange={(testData) =>
          setDraft((current) => ({
            ...current,
            uiContext: { ...current.uiContext, testData },
          }))
        }
      />

      <StringListEditor
        label={copy.preconditions}
        items={draft.preconditions}
        readOnly={isReadOnly}
        placeholder="测试账号已开通"
        onChange={(preconditions) => setDraft((current) => ({ ...current, preconditions }))}
      />

      <section className="composer-section">
        <div className="string-list-header">
          <h4>{copy.uiStepsSection}</h4>
          {!isReadOnly ? (
            <button className="button-secondary" type="button" onClick={addStep}>
              + 添加步骤
            </button>
          ) : null}
        </div>
        <div className="ui-steps-table-wrap">
          <table className="ui-steps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{copy.actionColumn}</th>
                <th>{copy.targetColumn}</th>
                <th>{copy.locatorColumn}</th>
                <th>{copy.valueColumn}</th>
                <th>{copy.assertionColumn}</th>
                {!isReadOnly ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {draft.steps.map((step, index) => (
                <tr key={`step-${index}`}>
                  <td className="step-index">{index + 1}</td>
                  <td>
                    <select
                      disabled={isReadOnly}
                      value={step.action}
                      onChange={(event) => updateStep(index, { action: event.target.value })}
                    >
                      {UI_STEP_ACTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      rows={2}
                      readOnly={isReadOnly}
                      value={step.target}
                      placeholder="用户名输入框"
                      onChange={(event) => updateStep(index, { target: event.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      rows={2}
                      readOnly={isReadOnly}
                      value={step.locatorHint ?? ""}
                      placeholder="[data-testid='username']"
                      onChange={(event) => updateStep(index, { locatorHint: event.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      rows={2}
                      readOnly={isReadOnly}
                      value={step.value ?? ""}
                      placeholder="/login 或 {{test_data.username}}"
                      onChange={(event) => updateStep(index, { value: event.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      rows={2}
                      readOnly={isReadOnly}
                      value={step.assertion ?? ""}
                      placeholder="元素可见 / URL 匹配"
                      onChange={(event) => updateStep(index, { assertion: event.target.value })}
                    />
                  </td>
                  {!isReadOnly ? (
                    <td>
                      <button
                        className="button-ghost"
                        type="button"
                        disabled={draft.steps.length <= 1}
                        onClick={() => removeStep(index)}
                      >
                        删除
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <StringListEditor
        label={copy.expectedSummary}
        items={draft.expectedResults.map((item) => item.text)}
        readOnly={isReadOnly}
        placeholder="成功进入系统首页"
        onChange={(items) =>
          setDraft((current) => ({
            ...current,
            expectedResults: items.filter(Boolean).map((text) => ({ text })),
          }))
        }
      />

      <label className="field">
        <span>{copy.automationNotes}</span>
        <textarea
          rows={3}
          readOnly={isReadOnly}
          value={draft.automationNotes ?? ""}
          placeholder="Playwright Page Object；失败截图+trace"
          onChange={(event) =>
            setDraft((current) => ({ ...current, automationNotes: event.target.value }))
          }
        />
      </label>

      <label className="field">
        <span>{copy.teardown}</span>
        <textarea
          rows={2}
          readOnly={isReadOnly}
          value={draft.uiContext.teardown}
          placeholder="退出登录并清理会话"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              uiContext: { ...current.uiContext, teardown: event.target.value },
            }))
          }
        />
      </label>
    </form>
  );
}
