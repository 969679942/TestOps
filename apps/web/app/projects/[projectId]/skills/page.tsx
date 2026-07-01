import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { ProjectArchiveBanner } from "../../../../components/project-archive-banner";
import { copy } from "../../../../lib/copy";
import {
  activateSkillPackageVersion,
  createProjectSkillBinding,
  createSkillPackage,
  createSkillPackageVersion,
  getProject,
  listGlobalSkillLibrary,
  listGlobalSkillVersions,
  listProjectSkillBindings,
  listProjectSkillPackages,
  listSkillPackageVersions,
  setProjectSkillBindingDefault,
  updateProjectSkillBinding,
} from "../../../../lib/api";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import { translateProjectName } from "../../../../lib/project-display";

type ProjectSkillsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

const recommendedTemplates = [
  {
    key: "prd_rules_core",
    label: "PRD + 业务规则主模板",
    description: "覆盖主流程、边界、异常、权限、状态流转，适合大多数业务系统作为起步模板。",
  },
  {
    key: "api_contract_regression",
    label: "API 合同与回归模板",
    description: "偏接口契约、字段校验、鉴权、幂等与错误码矩阵。",
  },
  {
    key: "workflow_recovery",
    label: "跨系统流程补场景模板",
    description: "适合基于已有用例补齐回滚、通知、审计、异步一致性与恢复场景。",
  },
];

function readFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export default async function ProjectSkillsPage({
  params,
  searchParams,
}: ProjectSkillsPageProps) {
  const { projectId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const projectResult = await getProject(projectId);

  if (projectResult.kind !== "success") {
    return (
      <AppShell currentPath={`/projects/${projectId}/skills`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">Skills</span>
          <h2>项目技能</h2>
          <p>项目信息暂时不可用。</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;
  const projectDisplayName = translateProjectName(project.name, locale);
  const archived = project.status === "archived";
  const [globalSkillsResult, bindingsResult, skillPackagesResult] = await Promise.all([
    listGlobalSkillLibrary(),
    listProjectSkillBindings(projectId),
    listProjectSkillPackages(projectId),
  ]);
  const globalSkills = globalSkillsResult.kind === "success" ? globalSkillsResult.data : [];
  const bindings = bindingsResult.kind === "success" ? bindingsResult.data : [];
  const skillPackages = skillPackagesResult.kind === "success" ? skillPackagesResult.data : [];
  const versionResults = await Promise.all(
    skillPackages.map(async (skillPackage) => ({
      skillPackageId: String(skillPackage.id),
      versions: await listSkillPackageVersions(String(skillPackage.id)),
    })),
  );
  const globalVersionResults = await Promise.all(
    globalSkills.map(async (skill) => ({
      skillId: String(skill.id),
      versions: await listGlobalSkillVersions(String(skill.id)),
    })),
  );

  async function createProjectSkillBindingAction(formData: FormData) {
    "use server";

    const globalSkillId = Number.parseInt(readFormText(formData, "globalSkillId"), 10);
    const bindingType = readFormText(formData, "bindingType") || "primary";

    await createProjectSkillBinding(projectId, {
      global_skill_id: globalSkillId,
      binding_type: bindingType,
      is_default: formData.get("isDefault") === "on",
    });
    revalidatePath(`/projects/${projectId}/skills`);
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  async function setProjectSkillBindingDefaultAction(formData: FormData) {
    "use server";

    const bindingId = readFormText(formData, "bindingId");
    await setProjectSkillBindingDefault(projectId, bindingId);
    revalidatePath(`/projects/${projectId}/skills`);
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  async function updateProjectSkillBindingAction(formData: FormData) {
    "use server";

    const bindingId = readFormText(formData, "bindingId");
    const globalSkillVersionId = Number.parseInt(readFormText(formData, "globalSkillVersionId"), 10);
    await updateProjectSkillBinding(projectId, bindingId, {
      global_skill_version_id: Number.isInteger(globalSkillVersionId) ? globalSkillVersionId : null,
      is_default: formData.get("makeDefault") === "on" ? true : undefined,
    });
    revalidatePath(`/projects/${projectId}/skills`);
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  async function createSkillPackageAction(formData: FormData) {
    "use server";

    await createSkillPackage(projectId, {
      system_key: readFormText(formData, "systemKey"),
      name: readFormText(formData, "name"),
    });
    revalidatePath(`/projects/${projectId}/skills`);
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  async function createSkillVersionAction(formData: FormData) {
    "use server";

    const skillPackageId = readFormText(formData, "skillPackageId");
    await createSkillPackageVersion(skillPackageId, {
      summary: readFormText(formData, "summary"),
      storage_uri: readFormText(formData, "storageUri") || null,
      template_key: readFormText(formData, "templateKey") || null,
      content: {
        prompt_template: readFormText(formData, "promptTemplate"),
        scenario_taxonomy: readFormText(formData, "scenarioTaxonomy")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        review_checklist: readFormText(formData, "reviewChecklist")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    });
    revalidatePath(`/projects/${projectId}/skills`);
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  async function activateSkillVersionAction(formData: FormData) {
    "use server";

    await activateSkillPackageVersion(
      projectId,
      readFormText(formData, "skillPackageId"),
      readFormText(formData, "versionId"),
    );
    revalidatePath(`/projects/${projectId}/skills`);
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  return (
    <AppShell currentPath={`/projects/${projectId}/skills`} locale={locale} project={project}>
      <section className="page-header">
        <span className="eyebrow">Skills</span>
        <h2>项目技能</h2>
        <p>当前项目：{projectDisplayName}。这里统一管理共享技能绑定、本地兼容包、版本归档与激活配置。</p>
      </section>

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Skills Center</span>
            <h3>统一技能中心</h3>
          </div>
          <p>共享技能、通用模板和版本治理已经集中到统一技能中心，项目内页面只保留绑定与兼容配置。</p>
        </div>
        <a className="button-secondary" href={localizedHref("/skills", locale)}>
          前往统一技能中心
        </a>
      </section>

      {archived ? <ProjectArchiveBanner /> : null}

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Project Skill Bindings</span>
            <h3>绑定共享技能</h3>
          </div>
          <p>从统一技能中心选择共享技能并绑定到当前项目，后续生成任务将优先使用这些绑定版本。</p>
        </div>
        {bindings.length > 0 ? (
          <div className="summary-grid" aria-label="项目技能概览">
            <article className="summary-card">
              <span className="eyebrow">当前项目默认技能</span>
              <p className="summary-value">
                {bindings.find((binding) => binding.isDefault)?.skillName ?? "未设置"}
              </p>
            </article>
            <article className="summary-card">
              <span className="eyebrow">共享技能绑定</span>
              <p className="summary-value">{bindings.length}</p>
            </article>
            <article className="summary-card">
              <span className="eyebrow">兼容模式</span>
              <p className="summary-value">{skillPackages.length > 0 ? "已保留" : "未使用"}</p>
            </article>
          </div>
        ) : null}
        {archived ? (
          <div className="archived-action-lock">{copy.archivedProjectActionHint}</div>
        ) : (
          <form action={createProjectSkillBindingAction} className="form-grid">
            <label className="form-field">
              <span>共享技能</span>
              <select className="field-input" name="globalSkillId" defaultValue="">
                <option value="" disabled>
                  请选择共享技能
                </option>
                {globalSkills.map((skill) => (
                  <option key={skill.id} value={String(skill.id)}>
                    {skill.name} · {skill.currentProductionVersionLabel ?? "未发布"}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>绑定类型</span>
              <select className="field-input" name="bindingType" defaultValue="primary">
                <option value="primary">主生成</option>
                <option value="api">API 专项</option>
                <option value="supplement">补场景专项</option>
              </select>
            </label>
            <label className="inline-check">
              <input type="checkbox" name="isDefault" defaultChecked={bindings.length === 0} />
              <span>设为默认技能</span>
            </label>
            <button className="primary-button" type="submit">
              绑定共享技能
            </button>
          </form>
        )}

        {bindings.length > 0 ? (
          <div className="review-stack">
            {bindings.map((binding) => {
              const bindingVersionsResult = globalVersionResults.find(
                (item) => item.skillId === String(binding.globalSkillId),
              )?.versions;
              const bindingVersions =
                bindingVersionsResult?.kind === "success" ? bindingVersionsResult.data : [];

              return (
                <article className="review-meta-card" key={binding.id}>
                  <span className="eyebrow">{binding.bindingType}</span>
                  <p className="summary-value">{binding.skillName}</p>
                  <p>
                    {binding.versionLabel} · {binding.skillCategory} / {binding.skillDomain}
                    {binding.isDefault ? " · 当前默认" : ""}
                  </p>
                  <p>适用输入：{binding.inputTypes.join(" / ")}</p>
                  <a
                    className="table-link"
                    href={localizedHref(`/skills/${binding.globalSkillId}`, locale)}
                  >
                    查看共享技能详情
                  </a>
                  {archived ? null : (
                    <>
                      <form action={updateProjectSkillBindingAction} className="review-stack">
                        <input type="hidden" name="bindingId" value={String(binding.id)} />
                        <label className="form-field">
                          <span>切换绑定版本</span>
                          <select
                            className="field-input"
                            name="globalSkillVersionId"
                            defaultValue={String(binding.globalSkillVersionId)}
                          >
                            {bindingVersions.map((version) => (
                              <option key={version.id} value={String(version.id)}>
                                {version.versionLabel} · {version.status}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="inline-check">
                          <input type="checkbox" name="makeDefault" defaultChecked={binding.isDefault} />
                          <span>切换后设为默认</span>
                        </label>
                        <button className="button-secondary" type="submit">
                          更新绑定版本
                        </button>
                      </form>
                      {binding.isDefault ? null : (
                        <form action={setProjectSkillBindingDefaultAction}>
                          <input type="hidden" name="bindingId" value={String(binding.id)} />
                          <button className="button-ghost" type="submit">
                            设为默认
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p>当前项目还没有绑定共享技能，生成任务将继续回退到旧的项目内 Skill Package。</p>
        )}
      </section>

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Legacy Local Skills</span>
            <h3>兼容项目内 Skill Package</h3>
          </div>
          <p>这部分保留给历史项目兼容使用。后续新项目建议优先绑定统一技能中心中的共享技能。</p>
        </div>
        <details>
          <summary className="button-secondary">展开兼容模式配置</summary>
          <div className="review-stack" style={{ marginTop: "1rem" }}>
            <p>仅当历史项目仍依赖旧的本地 Skill Package 时才需要配置。新项目建议直接使用共享 Skill 绑定。</p>
            <div className="review-stack">
              {recommendedTemplates.map((template) => (
                <article className="summary-card" key={template.key}>
                  <span className="eyebrow">{template.key}</span>
                  <p className="summary-value">{template.label}</p>
                  <p>{template.description}</p>
                </article>
              ))}
            </div>
            {archived ? (
              <div className="archived-action-lock">{copy.archivedProjectActionHint}</div>
            ) : (
              <form action={createSkillPackageAction} className="form-grid">
                <label className="form-field">
                  <span>System Key</span>
                  <input className="field-input" name="systemKey" placeholder="oms" />
                </label>
                <label className="form-field">
                  <span>Name</span>
                  <input className="field-input" name="name" placeholder="OMS Test Case Skill" />
                </label>
                <button className="primary-button" type="submit">
                  创建 Package
                </button>
              </form>
            )}
          </div>
        </details>
      </section>

      <section className="review-stack">
        {skillPackages.length === 0 ? (
          <article className="empty-card">
            <h3>当前没有项目内 Skill Package</h3>
            <p>如果是历史项目，可在这里补充本地兼容包；新项目建议优先绑定统一技能中心里的共享技能。</p>
          </article>
        ) : null}
        {skillPackages.map((skillPackage) => {
          const versionResult = versionResults.find(
            (item) => item.skillPackageId === String(skillPackage.id),
          )?.versions;
          const versions = versionResult?.kind === "success" ? versionResult.data : [];
          return (
            <article className="data-card" key={skillPackage.id}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{skillPackage.systemKey}</span>
                  <h3>{skillPackage.name}</h3>
                </div>
                <span className="status-pill">
                  {skillPackage.activeVersionSummary ?? "No active version"}
                </span>
              </div>

              {archived ? (
                <div className="archived-action-lock">{copy.archivedProjectActionHint}</div>
              ) : (
                <form action={createSkillVersionAction} className="review-stack">
                  <input type="hidden" name="skillPackageId" value={String(skillPackage.id)} />
                  <div className="form-grid">
                    <label className="form-field">
                      <span>Version Summary</span>
                      <input className="field-input" name="summary" placeholder="OMS v1" />
                    </label>
                    <label className="form-field">
                      <span>Archive URI</span>
                      <input
                        className="field-input"
                        name="storageUri"
                        placeholder="oss://skills/oms/v1.zip"
                      />
                    </label>
                    <label className="form-field">
                      <span>Template</span>
                      <select className="field-input" name="templateKey" defaultValue="prd_rules_core">
                        {recommendedTemplates.map((template) => (
                          <option key={template.key} value={template.key}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Prompt Template</span>
                      <input
                        className="field-input"
                        name="promptTemplate"
                        placeholder="Generate OMS cases"
                      />
                    </label>
                    <label className="form-field">
                      <span>Scenario Taxonomy</span>
                      <input
                        className="field-input"
                        name="scenarioTaxonomy"
                        placeholder="happy_path, boundary, permission"
                      />
                    </label>
                    <label className="form-field">
                      <span>Review Checklist</span>
                      <input
                        className="field-input"
                        name="reviewChecklist"
                        placeholder="traceable, observable"
                      />
                    </label>
                  </div>
                  <button className="button-secondary" type="submit">
                    添加版本
                  </button>
                </form>
              )}

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Summary</th>
                      <th>Archive URI</th>
                      <th>Taxonomy</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.length > 0 ? (
                      versions.map((version) => {
                        const taxonomy = Array.isArray(version.structuredMetadata.scenario_taxonomy)
                          ? version.structuredMetadata.scenario_taxonomy.join(", ")
                          : "-";
                        return (
                          <tr key={version.id}>
                            <td>v{version.versionNo}</td>
                            <td>{version.summary ?? "-"}</td>
                            <td>{version.storageUri ?? "-"}</td>
                            <td>{taxonomy}</td>
                            <td>
                              {archived ? (
                                <span>{String(skillPackage.activeVersionId) === String(version.id) ? "已激活" : "只读"}</span>
                              ) : (
                                <form action={activateSkillVersionAction}>
                                  <input
                                    type="hidden"
                                    name="skillPackageId"
                                    value={String(skillPackage.id)}
                                  />
                                  <input type="hidden" name="versionId" value={String(version.id)} />
                                  <button className="button-ghost" type="submit">
                                    {String(skillPackage.activeVersionId) === String(version.id)
                                      ? "已激活"
                                      : "设为激活"}
                                  </button>
                                </form>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5}>No versions yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
