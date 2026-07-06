import { formatSkillStatus, skillFieldLabels } from "../lib/skill-copy";
import { localizedHref, type Locale } from "../lib/i18n";
import type { GlobalSkillVersionRecord } from "../lib/types";

type SkillVersionTimelineProps = Readonly<{
  skillId: string;
  locale: Locale;
  versions: GlobalSkillVersionRecord[];
  createDraftAction?: React.ReactNode;
}>;

export function SkillVersionTimeline({
  skillId,
  locale,
  versions,
  createDraftAction,
}: SkillVersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="skill-version-timeline-empty">
        <p>还没有任何版本。</p>
        {createDraftAction}
      </div>
    );
  }

  const sortedVersions = [...versions].sort((left, right) => right.versionNo - left.versionNo);

  return (
    <div className="skill-version-timeline">
      <div className="skill-version-timeline-header">
        <p>共 {versions.length} 个版本。生产版本只读，草稿版本可进入编辑。</p>
        {createDraftAction}
      </div>
      <ol className="skill-version-timeline-list">
        {sortedVersions.map((version) => {
          const detailHref = localizedHref(`/skills/${skillId}/versions/${version.id}`, locale);
          const isDraft = version.status === "draft";
          const summary = version.changeLog?.trim() || version.releaseNotes?.trim() || "暂无变更说明";

          return (
            <li className="skill-version-timeline-item" key={version.id}>
              <div className="skill-version-timeline-main">
                <div className="skill-version-timeline-title-row">
                  <strong>
                    v{version.versionNo} · {version.versionLabel}
                  </strong>
                  <span className={`status-badge status-badge--${version.status}`}>
                    {formatSkillStatus(version.status)}
                  </span>
                </div>
                <p className="skill-version-timeline-summary">{summary}</p>
                <div className="skill-version-timeline-meta">
                  <span>{skillFieldLabels.createdBy}：{version.createdBy}</span>
                  {version.publishedAt ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {skillFieldLabels.publishedAt}：{version.publishedAt}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="skill-version-timeline-actions">
                <a className="button-secondary" href={detailHref}>
                  {isDraft ? "编辑草稿" : "查看版本"}
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
