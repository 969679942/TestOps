import React from "react";

import { copy, formatValue, type Locale } from "../lib/i18n";
import type { GenerationTaskRecord } from "../lib/types";

type GenerationTaskListProps = Readonly<{
  items: GenerationTaskRecord[];
  locale?: Locale;
}>;

function getDocumentCount(inputRefs: Record<string, unknown>) {
  const documentIds = inputRefs.document_version_ids ?? inputRefs.document_ids;
  return Array.isArray(documentIds) ? documentIds.length : 0;
}

function getSeedCaseCount(inputRefs: Record<string, unknown>) {
  const seedTestCaseIds = inputRefs.seed_test_case_ids;
  return Array.isArray(seedTestCaseIds) ? seedTestCaseIds.length : 0;
}

function getCoverageGapNote(inputRefs: Record<string, unknown>) {
  return typeof inputRefs.coverage_gap_note === "string" ? inputRefs.coverage_gap_note : null;
}

function getSkillSourceSummary(inputRefs: Record<string, unknown>) {
  const snapshot = inputRefs.skill_binding_snapshot;
  if (snapshot && typeof snapshot === "object") {
    const bindingSnapshot = snapshot as Record<string, unknown>;
    const skillName =
      typeof bindingSnapshot.skill_name === "string" ? bindingSnapshot.skill_name : "共享技能";
    const versionLabel =
      typeof bindingSnapshot.version_label === "string"
        ? bindingSnapshot.version_label
        : typeof inputRefs.global_skill_version_id === "number"
          ? `版本 #${inputRefs.global_skill_version_id}`
          : "版本未标记";
    return `${skillName} · ${versionLabel}`;
  }

  const skillVersionId = inputRefs.skill_version_id;
  if (typeof skillVersionId === "number") {
    return `本地 Skill 版本 #${skillVersionId}`;
  }

  return "未记录";
}

export function GenerationTaskList({ items, locale = "zh" }: GenerationTaskListProps) {
  const t = copy[locale].components;

  if (!items.length) {
    return (
      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.queue}</span>
            <h3>{t.generationTasks}</h3>
          </div>
          <p>{t.taskIntro}</p>
        </div>
        <p className="empty-copy">{t.noTasks}</p>
      </section>
    );
  }

  return (
    <section className="task-list" aria-label={t.generationTasks}>
      {items.map((item) => (
        <article key={item.id} className="task-card">
          <div className="task-card-header">
            <div>
              <span className="eyebrow">{t.task} #{item.id}</span>
              <h3>{formatValue(item.status, locale)}</h3>
            </div>
            <span className="status-pill">{formatValue(item.provider, locale)}</span>
          </div>

          <dl className="task-meta">
            <div>
              <dt>{t.model}</dt>
              <dd>{item.model}</dd>
            </div>
            <div>
              <dt>{t.promptProfile}</dt>
              <dd>{item.promptVersion}</dd>
            </div>
            <div>
              <dt>{t.inputDocuments}</dt>
              <dd>{getDocumentCount(item.inputRefs)}</dd>
            </div>
            <div>
              <dt>参考用例</dt>
              <dd>{getSeedCaseCount(item.inputRefs)}</dd>
            </div>
            <div>
              <dt>{t.created}</dt>
              <dd>{item.createdAt}</dd>
            </div>
            <div>
              <dt>技能来源</dt>
              <dd>{getSkillSourceSummary(item.inputRefs)}</dd>
            </div>
          </dl>

          {getCoverageGapNote(item.inputRefs) ? (
            <p className="task-copy">补充说明：{getCoverageGapNote(item.inputRefs)}</p>
          ) : null}
          {item.errorMessage ? <p className="task-error">{item.errorMessage}</p> : null}
        </article>
      ))}
    </section>
  );
}
