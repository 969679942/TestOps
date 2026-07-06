import { formatSkillStatus } from "../lib/skill-copy";
import { localizedHref, type Locale } from "../lib/i18n";
import type { GlobalSkillProjectBindingRecord } from "../lib/types";

type SkillBindingsPanelProps = Readonly<{
  locale: Locale;
  bindings: GlobalSkillProjectBindingRecord[];
}>;

export function SkillBindingsPanel({ locale, bindings }: SkillBindingsPanelProps) {
  if (bindings.length === 0) {
    return (
      <div className="skill-bindings-empty">
        <p>当前还没有项目绑定此 Skill。</p>
        <p className="helper-text">可在项目空间的「项目技能」页绑定共享技能库中的版本。</p>
        <a className="button-secondary" href={localizedHref("/", locale)}>
          前往项目列表
        </a>
      </div>
    );
  }

  return (
    <div className="skill-bindings-panel">
      <p className="skill-bindings-summary">共 {bindings.length} 个项目正在使用此 Skill。</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>项目</th>
              <th>绑定类型</th>
              <th>绑定版本</th>
              <th>状态</th>
              <th>最近更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bindings.map((binding) => (
              <tr key={binding.bindingId}>
                <td>
                  <strong>{binding.projectName}</strong>
                  <div className="table-detail">
                    <p>{binding.projectCode}</p>
                  </div>
                </td>
                <td>
                  {binding.bindingType}
                  {binding.isDefault ? " · 默认" : ""}
                </td>
                <td>{binding.versionLabel}</td>
                <td>
                  <span className={`status-badge status-badge--${binding.versionStatus}`}>
                    {formatSkillStatus(binding.versionStatus)}
                  </span>
                </td>
                <td>{binding.updatedAt}</td>
                <td>
                  <a
                    className="button-secondary"
                    href={localizedHref(`/projects/${binding.projectId}/skills`, locale)}
                  >
                    打开项目绑定
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="helper-text">
        项目绑定的是具体版本。升级生产版本后，项目可选择切换到新版本。
      </p>
    </div>
  );
}
