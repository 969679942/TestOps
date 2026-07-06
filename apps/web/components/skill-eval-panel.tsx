import { skillFieldLabels } from "../lib/skill-copy";
import type { GlobalSkillUsageStatsRecord, GlobalSkillVersionRecord } from "../lib/types";

type SkillEvalPanelProps = Readonly<{
  stats: GlobalSkillUsageStatsRecord;
  versions: GlobalSkillVersionRecord[];
}>;

export function SkillEvalPanel({ stats, versions }: SkillEvalPanelProps) {
  const draftVersions = versions.filter((version) => version.status === "draft");
  const successRate =
    stats.generationTaskCount === 0
      ? 0
      : Math.round((stats.succeededGenerationCount / stats.generationTaskCount) * 100);

  return (
    <div className="skill-eval-panel">
      <div className="summary-grid">
        <article className="summary-card">
          <span className="eyebrow">绑定项目</span>
          <p className="summary-value">{stats.boundProjectCount}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">生成任务</span>
          <p className="summary-value">{stats.generationTaskCount}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">成功率</span>
          <p className="summary-value">{successRate}%</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">草稿版本</span>
          <p className="summary-value">{stats.draftVersionCount}</p>
        </article>
      </div>

      <div className="skill-eval-details">
        <article className="review-meta-card">
          <span className="eyebrow">生产版本</span>
          <p>{stats.productionVersionLabel ?? "未发布"}</p>
        </article>
        <article className="review-meta-card">
          <span className="eyebrow">最近生成</span>
          <p>{stats.latestGenerationAt ?? "尚无生成记录"}</p>
        </article>
        <article className="review-meta-card">
          <span className="eyebrow">失败任务</span>
          <p>{stats.failedGenerationCount}</p>
        </article>
      </div>

      <section className="skill-eval-candidates">
        <div className="section-heading">
          <div>
            <span className="eyebrow">候选实验</span>
            <h3>Staging / 草稿版本</h3>
          </div>
          <p>可将草稿版本发布前在此观察绑定与生成数据。完整 A/B 评测将在后续版本接入。</p>
        </div>
        {draftVersions.length === 0 ? (
          <p className="skill-detail-muted">当前没有可用于实验的草稿版本。</p>
        ) : (
          <ul className="skill-eval-candidate-list">
            {draftVersions.map((version) => (
              <li key={version.id} className="skill-eval-candidate-item">
                <strong>
                  v{version.versionNo} · {version.versionLabel}
                </strong>
                <span>{version.changeLog ?? "暂无变更说明"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="helper-text">
        评审清单（{skillFieldLabels.reviewChecklist}）已在评审工作台生效，用于人工质检而非生成阶段。
      </p>
    </div>
  );
}
