"use client";

import { useRef } from "react";

import {
  UI_STEP_ACTIONS,
  type UIAutomationStep,
} from "../lib/ui-automation-case";
import { FieldLabel } from "./field-label";

type TestCaseStepTableEditorProps = Readonly<{
  steps: UIAutomationStep[];
  expectedResults: { text: string }[];
  readOnly: boolean;
  stepErrorIndexes?: number[];
  expectedResultErrorIndexes?: number[];
  onChange: (next: {
    steps: UIAutomationStep[];
    expectedResults: { text: string }[];
  }) => void;
}>;

function actionLabel(action: string) {
  return UI_STEP_ACTIONS.find((item) => item.value === action)?.label ?? action;
}

export function TestCaseStepTableEditor({
  steps,
  expectedResults,
  readOnly,
  stepErrorIndexes = [],
  expectedResultErrorIndexes = [],
  onChange,
}: TestCaseStepTableEditorProps) {
  const stepKeyMapRef = useRef(new WeakMap<UIAutomationStep, string>());
  const nextStepKeyRef = useRef(0);

  function getStepKey(step: UIAutomationStep) {
    const existing = stepKeyMapRef.current.get(step);
    if (existing) {
      return existing;
    }

    const key = `composer-step-${nextStepKeyRef.current}`;
    nextStepKeyRef.current += 1;
    stepKeyMapRef.current.set(step, key);
    return key;
  }

  function updateStep(index: number, patch: Partial<UIAutomationStep>) {
    onChange({
      steps: steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch, order: index + 1 } : step,
      ),
      expectedResults,
    });
  }

  function updateExpected(index: number, text: string) {
    onChange({
      steps,
      expectedResults: expectedResults.map((item, itemIndex) =>
        itemIndex === index ? { text } : item,
      ),
    });
  }

  function addStep() {
    onChange({
      steps: [
        ...steps,
        {
          order: steps.length + 1,
          action: "click",
          target: "",
          locatorHint: "",
          value: "",
          assertion: "",
        },
      ],
      expectedResults: [...expectedResults, { text: "" }],
    });
  }

  function removeStep(index: number) {
    onChange({
      steps: steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, order: stepIndex + 1 })),
      expectedResults: expectedResults.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <section className="case-step-editor">
      <div className="string-list-header">
        <h3>
          <FieldLabel required>测试步骤</FieldLabel>
        </h3>
        {!readOnly ? (
          <button className="button-secondary" type="button" onClick={addStep}>
            + 添加步骤
          </button>
        ) : null}
      </div>

      <div className="table-scroll case-step-table-scroll">
        <table className="data-table case-step-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>
                <FieldLabel required>步骤描述</FieldLabel>
              </th>
              <th>
                <FieldLabel required>预期结果</FieldLabel>
              </th>
              {!readOnly ? <th>操作</th> : null}
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={getStepKey(step)}>
                <td className="case-step-index">{index + 1}</td>
                <td>
                  <div className="case-step-cell">
                    <label className="field">
                      <span className="sr-only">动作</span>
                      <select
                        disabled={readOnly}
                        value={step.action}
                        onChange={(event) => updateStep(index, { action: event.target.value })}
                      >
                        {UI_STEP_ACTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <textarea
                      aria-invalid={stepErrorIndexes.includes(index) ? "true" : "false"}
                      className={stepErrorIndexes.includes(index) ? "is-invalid" : ""}
                      rows={3}
                      readOnly={readOnly}
                      placeholder="请输入步骤描述"
                      value={step.target}
                      onChange={(event) => updateStep(index, { target: event.target.value })}
                    />
                    <div className="case-step-inline-fields">
                      <input
                        readOnly={readOnly}
                        placeholder="定位提示"
                        value={step.locatorHint ?? ""}
                        onChange={(event) =>
                          updateStep(index, { locatorHint: event.target.value })
                        }
                      />
                      <input
                        readOnly={readOnly}
                        placeholder="输入值"
                        value={step.value ?? ""}
                        onChange={(event) => updateStep(index, { value: event.target.value })}
                      />
                    </div>
                    <p className="helper-text">当前动作：{actionLabel(step.action)}</p>
                  </div>
                </td>
                <td>
                  <textarea
                    aria-invalid={expectedResultErrorIndexes.includes(index) ? "true" : "false"}
                    className={expectedResultErrorIndexes.includes(index) ? "is-invalid" : ""}
                    rows={6}
                    readOnly={readOnly}
                    placeholder="请输入预期结果"
                    value={expectedResults[index]?.text ?? step.assertion ?? ""}
                    onChange={(event) => updateExpected(index, event.target.value)}
                  />
                </td>
                {!readOnly ? (
                  <td>
                    <button
                      className="button-ghost"
                      type="button"
                      disabled={steps.length <= 1}
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
  );
}
