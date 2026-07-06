import React from "react";

import { copy, formatValue, type Locale } from "../lib/i18n";
import type { GenerationTaskRecord } from "../lib/types";
import { StatusBadge } from "./status-badge";

type GenerationTaskListProps = Readonly<{
  items: GenerationTaskRecord[];
  locale?: Locale;
  highlightFailed?: boolean;
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

function sortTasks(items: GenerationTaskRecord[]) {
  return [...items].sort((left, right) => {
    if (left.status === "failed" && right.status !== "failed") {
      return -1;
    }
    if (left.status !== "failed" && right.status === "failed") {
      return 1;
    }
    return String(right.createdAt).localeCompare(String(left.createdAt));
  });
}

function resolveTaskErrorMessage(item: GenerationTaskRecord) {
  if (item.status !== "failed") {
    return null;
  }

  const message = item.errorMessage?.trim();
  return (
    message ||
    "任务失败，但未返回具体原因。请检查资料解析状态、Skill 绑定与后端日志，修正后重新创建生成任务。"
  );
}

export function GenerationTaskList({
  items,
  locale = "zh",
  highlightFailed = false,
}: GenerationTaskListProps) {
  const t = copy[locale].components;
  const sortedItems = sortTasks(items);
  const failedItems = sortedItems.filter((item) => item.status === "failed");
  let assignFailedAnchor = highlightFailed;

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
      {sortedItems.map((item) => {
        const isFailed = item.status === "failed";
        let anchorId: string | undefined;
        if (isFailed && assignFailedAnchor) {
          anchorId = "generation-task-failed";
          assignFailedAnchor = false;
        }
        const errorMessage = resolveTaskErrorMessage(item);

        return (
          <article
            key={item.id}
            id={anchorId}
            className={`task-card ${isFailed ? "task-card--failed" : ""}`}
          >
            <div className="task-card-header">
              <div>
                <span className="eyebrow">{t.task} #{item.id}</span>
                <h3>{formatValue(item.status, locale)}</h3>
              </div>
              <div className="task-card-badges">
                <StatusBadge status={item.status} />
                <span className="status-pill">{formatValue(item.provider, locale)}</span>
              </div>
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
              {item.finishedAt ? (
                <div>
                  <dt>结束时间</dt>
                  <dd>{item.finishedAt}</dd>
                </div>
              ) : null}
            </dl>

            {getCoverageGapNote(item.inputRefs) ? (
              <p className="task-copy">补充说明：{getCoverageGapNote(item.inputRefs)}</p>
            ) : null}

            {isFailed && errorMessage ? (
              <section className="task-error-panel" aria-label="失败原因">
                <span className="eyebrow">失败原因</span>
                <p className="task-error">{errorMessage}</p>
              </section>
            ) : null}
          </article>
        );
      })}

      {failedItems.length === 0 ? null : (
        <p className="helper-text">共 {failedItems.length} 个失败任务，已优先展示在列表顶部。</p>
      )}
    </section>
  );
}
