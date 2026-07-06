import {
  formatSkillCategory,
  formatSkillDomain,
  formatSkillInputTypes,
  formatSkillStatus,
  formatSkillTokenList,
  skillFieldLabels,
} from "../lib/skill-copy";
import {
  hasSkillTokenValues,
  isDefaultSkillName,
  isMeaningfulSkillDescription,
  isMeaningfulSkillText,
  shouldShowSkillCategory,
  shouldShowSkillDomain,
  shouldShowSkillOwner,
} from "../lib/skill-content-utils";
import type { GlobalSkillDefinitionRecord, GlobalSkillVersionRecord } from "../lib/types";

type SkillDetailContentProps = Readonly<{
  skill: GlobalSkillDefinitionRecord;
  version: GlobalSkillVersionRecord | null;
}>;

function ContentBlock({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="skill-preview-block skill-preview-block--prominent">
      <h4 className="skill-preview-block-title">{label}</h4>
      <pre className="skill-preview-block-body">{value}</pre>
    </article>
  );
}

function MetaChip({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <span className="skill-detail-chip">
      {label}: {value}
    </span>
  );
}

export function SkillDetailContent({ skill, version }: SkillDetailContentProps) {
  const metaItems: Array<{ key: string; label: string; value: string }> = [];

  if (shouldShowSkillCategory(skill.category)) {
    metaItems.push({
      key: "category",
      label: skillFieldLabels.category,
      value: formatSkillCategory(skill.category),
    });
  }

  if (shouldShowSkillDomain(skill.domain)) {
    metaItems.push({
      key: "domain",
      label: skillFieldLabels.domain,
      value: formatSkillDomain(skill.domain),
    });
  }

  if (skill.inputTypes.length > 0) {
    metaItems.push({
      key: "inputTypes",
      label: skillFieldLabels.inputTypes,
      value: formatSkillInputTypes(skill.inputTypes),
    });
  }

  if (shouldShowSkillOwner(skill.owner)) {
    metaItems.push({ key: "owner", label: skillFieldLabels.owner, value: skill.owner });
  }

  return (
    <div className="skill-detail-content">
      <section className="skill-detail-section">
        <div className="skill-detail-header">
          <span className="eyebrow">{skill.skillKey}</span>
          <h3>{isDefaultSkillName(skill.name) ? skill.skillKey : skill.name}</h3>
          {isMeaningfulSkillDescription(skill.description) ? (
            <p className="skill-detail-lead">{skill.description}</p>
          ) : null}
        </div>
        {metaItems.length > 0 ? (
          <div className="skill-detail-chips">
            {metaItems.map((item) => (
              <MetaChip key={item.key} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </section>

      {version ? (
        <section className="skill-detail-section">
          <div className="skill-detail-section-heading">
            <span className="eyebrow">版本 {version.versionNo}</span>
            <h4>{version.versionLabel}</h4>
            <span className={`status-badge status-badge--${version.status}`}>
              {formatSkillStatus(version.status)}
            </span>
          </div>

          <ContentBlock label={skillFieldLabels.promptTemplate} value={version.promptTemplate} />
          <ContentBlock label={skillFieldLabels.evidencePolicy} value={version.evidencePolicy} />

          {hasSkillTokenValues(version.scenarioTaxonomy) ? (
            <div className="skill-detail-field">
              <span className="skill-detail-label">{skillFieldLabels.scenarioTaxonomy}</span>
              <div className="skill-detail-chips">
                {version.scenarioTaxonomy.map((item) => (
                  <span className="skill-detail-chip" key={item}>
                    {formatSkillTokenList([item])}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {isMeaningfulSkillText(version.changeLog) ? (
            <ContentBlock label={skillFieldLabels.changeLog} value={version.changeLog ?? ""} />
          ) : null}
        </section>
      ) : (
        <section className="skill-detail-section">
          <p className="skill-detail-muted">尚未编写 Skill 内容，请进入编辑页填写提示词与证据策略。</p>
        </section>
      )}
    </div>
  );
}
