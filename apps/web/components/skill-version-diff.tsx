"use client";

import { useMemo, useState } from "react";

import { skillFieldLabels } from "../lib/skill-copy";
import type { GlobalSkillVersionRecord } from "../lib/types";

type SkillVersionDiffProps = Readonly<{
  versions: GlobalSkillVersionRecord[];
}>;

type DiffLine = {
  kind: "same" | "add" | "remove";
  text: string;
};

function buildLineDiff(left: string, right: string): DiffLine[] {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const max = Math.max(leftLines.length, rightLines.length);
  const lines: DiffLine[] = [];

  for (let index = 0; index < max; index += 1) {
    const leftLine = leftLines[index];
    const rightLine = rightLines[index];
    if (leftLine === rightLine) {
      if (leftLine !== undefined) {
        lines.push({ kind: "same", text: leftLine });
      }
      continue;
    }
    if (leftLine !== undefined) {
      lines.push({ kind: "remove", text: leftLine });
    }
    if (rightLine !== undefined) {
      lines.push({ kind: "add", text: rightLine });
    }
  }

  return lines;
}

export function SkillVersionDiff({ versions }: SkillVersionDiffProps) {
  const sorted = useMemo(
    () => [...versions].sort((left, right) => right.versionNo - left.versionNo),
    [versions],
  );
  const [leftId, setLeftId] = useState(String(sorted[1]?.id ?? sorted[0]?.id ?? ""));
  const [rightId, setRightId] = useState(String(sorted[0]?.id ?? ""));

  const leftVersion = sorted.find((item) => String(item.id) === leftId) ?? sorted[0];
  const rightVersion = sorted.find((item) => String(item.id) === rightId) ?? sorted[0];

  if (!leftVersion || !rightVersion || sorted.length < 2) {
    return <p className="skill-detail-muted">至少需要两个版本才能对比差异。</p>;
  }

  const promptDiff = buildLineDiff(leftVersion.promptTemplate, rightVersion.promptTemplate);
  const evidenceDiff = buildLineDiff(leftVersion.evidencePolicy, rightVersion.evidencePolicy);

  return (
    <div className="skill-version-diff">
      <div className="skill-version-diff-controls">
        <label className="form-field">
          <span>基准版本</span>
          <select className="field-input" value={leftId} onChange={(event) => setLeftId(event.target.value)}>
            {sorted.map((version) => (
              <option key={version.id} value={String(version.id)}>
                v{version.versionNo} · {version.versionLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>对比版本</span>
          <select className="field-input" value={rightId} onChange={(event) => setRightId(event.target.value)}>
            {sorted.map((version) => (
              <option key={version.id} value={String(version.id)}>
                v{version.versionNo} · {version.versionLabel}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="skill-version-diff-panels">
        <article className="skill-version-diff-panel">
          <h4>{skillFieldLabels.promptTemplate}</h4>
          <pre className="skill-version-diff-body">
            {promptDiff.map((line, index) => (
              <div key={`prompt-${index}`} className={`skill-diff-line skill-diff-line--${line.kind}`}>
                {line.text || " "}
              </div>
            ))}
          </pre>
        </article>
        <article className="skill-version-diff-panel">
          <h4>{skillFieldLabels.evidencePolicy}</h4>
          <pre className="skill-version-diff-body">
            {evidenceDiff.map((line, index) => (
              <div key={`evidence-${index}`} className={`skill-diff-line skill-diff-line--${line.kind}`}>
                {line.text || " "}
              </div>
            ))}
          </pre>
        </article>
      </div>
    </div>
  );
}
