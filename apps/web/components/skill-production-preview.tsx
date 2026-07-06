import React from "react";

import {
  formatSkillInputTypes,
  formatSkillStatus,
  formatSkillTokenList,
  skillFieldLabels,
} from "../lib/skill-copy";
import {
  hasSkillTokenValues,
  isMeaningfulSkillText,
  shouldShowSkillCategory,
  shouldShowSkillDomain,
} from "../lib/skill-content-utils";
import type { GlobalSkillDefinitionRecord, GlobalSkillVersionRecord } from "../lib/types";

type SkillProductionPreviewProps = Readonly<{
  skill: GlobalSkillDefinitionRecord;
  version: GlobalSkillVersionRecord | null;
  forkDraftAction?: React.ReactNode;
}>;

function PreviewBlock({
  label,
  value,
  prominent = false,
}: Readonly<{ label: string; value: string; prominent?: boolean }>) {
  return (
    <article className={`skill-preview-block${prominent ? " skill-preview-block--prominent" : ""}`}>
      <h4 className="skill-preview-block-title">{label}</h4>
      <pre className="skill-preview-block-body">{value}</pre>
    </article>
  );
}

export function SkillProductionPreview({ skill, version, forkDraftAction }: SkillProductionPreviewProps) {
  if (!version) {
    return (
      <div className="skill-preview-empty">
        <p>当前 Skill 还没有版本，请先创建首个草稿并编写提示词内容。</p>
        {forkDraftAction}
      </div>
    );
  }

  const metaParts = [
    shouldShowSkillCategory(skill.category) ? skill.category : null,
    shouldShowSkillDomain(skill.domain) ? skill.domain : null,
    skill.inputTypes.length > 0 ? formatSkillInputTypes(skill.inputTypes) : null,
    formatSkillStatus(version.status),
    version.versionLabel,
  ].filter(Boolean);

  return (
    <div className="skill-production-preview">
      {metaParts.length > 0 ? (
        <div className="skill-preview-meta-bar">
          {metaParts.map((part, index) => (
            <React.Fragment key={`${part}-${index}`}>
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      <PreviewBlock label={skillFieldLabels.promptTemplate} value={version.promptTemplate} prominent />
      <PreviewBlock label={skillFieldLabels.evidencePolicy} value={version.evidencePolicy} prominent />

      {hasSkillTokenValues(version.scenarioTaxonomy) ? (
        <div className="skill-preview-chip-grid">
          <article className="skill-preview-block">
            <h4 className="skill-preview-block-title">{skillFieldLabels.scenarioTaxonomy}</h4>
            <div className="skill-detail-chips">
              {version.scenarioTaxonomy.map((item) => (
                <span className="skill-detail-chip" key={item}>
                  {formatSkillTokenList([item])}
                </span>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {isMeaningfulSkillText(version.changeLog) ? (
        <PreviewBlock label={skillFieldLabels.changeLog} value={version.changeLog ?? ""} />
      ) : null}

      {forkDraftAction ? <div className="skill-preview-actions">{forkDraftAction}</div> : null}
    </div>
  );
}
