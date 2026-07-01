import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../components/app-shell";
import { SkillVersionPublishAction } from "../../../components/skill-version-publish-action";
import { SkillVersionRollbackAction } from "../../../components/skill-version-rollback-action";
import {
  getGlobalSkillLibraryItem,
  listGlobalSkillVersions,
  publishGlobalSkillVersion,
  rollbackGlobalSkillVersion,
  updateGlobalSkillLibraryItem,
  updateGlobalSkillVersion,
} from "../../../lib/api";
import { normalizeLocale, type LocaleSearchParams } from "../../../lib/i18n";

type SkillDetailPageProps = Readonly<{
  params: Promise<{
    skillId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
}>;

function readFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readCommaList(formData: FormData, name: string) {
  return readFormText(formData, name)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function SkillDetailPage({
  params,
  searchParams,
}: SkillDetailPageProps) {
  const { skillId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const skillResult = await getGlobalSkillLibraryItem(skillId);
  const versionsResult = await listGlobalSkillVersions(skillId);

  if (skillResult.kind !== "success") {
    return (
      <AppShell currentPath="/skills" locale={locale} contentWidth="wide">
        <section className="page-header">
          <span className="eyebrow">Skills</span>
          <h2>技能详情不可用</h2>
          <p>当前无法加载所选 Skill。</p>
        </section>
      </AppShell>
    );
  }

  const skill = skillResult.data;
  const versions = versionsResult.kind === "success" ? versionsResult.data : [];
  const productionVersion =
    versions.find((item) => item.status === "production") ?? versions[0] ?? null;

  async function updateSkillAction(formData: FormData) {
    "use server";

    await updateGlobalSkillLibraryItem(skillId, {
      name: readFormText(formData, "name"),
      description: readFormText(formData, "description"),
      category: readFormText(formData, "category"),
      domain: readFormText(formData, "domain"),
      input_types: readCommaList(formData, "inputTypes"),
      owner: readFormText(formData, "owner") || undefined,
      status: readFormText(formData, "status") || undefined,
    });
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function updateVersionAction(formData: FormData) {
    "use server";

    const versionId = readFormText(formData, "versionId");
    await updateGlobalSkillVersion(skillId, versionId, {
      version_label: readFormText(formData, "versionLabel") || undefined,
      prompt_template: readFormText(formData, "promptTemplate") || undefined,
      scenario_taxonomy: readCommaList(formData, "scenarioTaxonomy"),
      review_checklist: readCommaList(formData, "reviewChecklist"),
      coverage_dimensions: readCommaList(formData, "coverageDimensions"),
      evidence_policy: readFormText(formData, "evidencePolicy") || undefined,
      storage_uri: readFormText(formData, "storageUri") || null,
      change_log: readFormText(formData, "changeLog") || null,
      release_notes: readFormText(formData, "releaseNotes") || null,
      created_by: readFormText(formData, "createdBy") || undefined,
      status: readFormText(formData, "status") || undefined,
    });
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function publishVersionAction(formData: FormData) {
    "use server";

    const versionId = readFormText(formData, "versionId");
    await publishGlobalSkillVersion(skillId, versionId);
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function rollbackVersionAction(formData: FormData) {
    "use server";

    const versionId = readFormText(formData, "versionId");
    await rollbackGlobalSkillVersion(skillId, versionId);
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  return (
    <AppShell currentPath={`/skills/${skillId}`} locale={locale} contentWidth="wide">
      <section className="page-header">
        <span className="eyebrow">{skill.skillKey}</span>
        <h2>{skill.name}</h2>
        <p>{skill.description}</p>
      </section>

      <section className="summary-grid" aria-label="Skill 详情概览">
        <article className="summary-card">
          <span className="eyebrow">分类</span>
          <p className="summary-value">{skill.category}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">领域</span>
          <p className="summary-value">{skill.domain}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">生产版本</span>
          <p className="summary-value">{skill.currentProductionVersionLabel ?? "未发布"}</p>
        </article>
      </section>

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Skill Metadata</span>
            <h3>在线修改 Skill 定义</h3>
          </div>
          <p>这里维护 Skill 的基础信息。真正影响生成行为的 Prompt、taxonomy 与证据策略，建议通过新建版本来更新。</p>
        </div>
        <form action={updateSkillAction} className="form-grid">
          <label className="form-field">
            <span>名称</span>
            <input className="field-input" name="name" defaultValue={skill.name} />
          </label>
          <label className="form-field">
            <span>分类</span>
            <input className="field-input" name="category" defaultValue={skill.category} />
          </label>
          <label className="form-field">
            <span>领域</span>
            <input className="field-input" name="domain" defaultValue={skill.domain} />
          </label>
          <label className="form-field">
            <span>输入类型</span>
            <input className="field-input" name="inputTypes" defaultValue={skill.inputTypes.join(", ")} />
          </label>
          <label className="form-field">
            <span>维护者</span>
            <input className="field-input" name="owner" defaultValue={skill.owner} />
          </label>
          <label className="form-field">
            <span>状态</span>
            <input className="field-input" name="status" defaultValue={skill.status} />
          </label>
          <label className="form-field">
            <span>描述</span>
            <textarea className="field-input" name="description" rows={4} defaultValue={skill.description} />
          </label>
          <button className="primary-button" type="submit">
            保存 Skill 定义
          </button>
        </form>
      </section>

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Update Strategy</span>
            <h3>推荐更新方式</h3>
          </div>
          <p>成熟产品一般不直接覆盖生产 Prompt，而是走“新建草稿版本 → 在线修改 → 评审发布 → 项目逐步切换”。</p>
        </div>
        <div className="review-stack">
          <article className="review-meta-card">
            <span className="eyebrow">上传 Skills</span>
            <p>如果你有外部 Skill 包，可以把 OSS、Git、Zip 或文档归档地址填到版本的 `Storage URI`。当前系统把它作为归档与追溯入口。</p>
          </article>
          <article className="review-meta-card">
            <span className="eyebrow">更新 Skills</span>
            <p>如果 Prompt 或规则有变化，新建一个版本草稿，再在线修改并发布，不建议直接改历史生产版本。</p>
          </article>
          <article className="review-meta-card">
            <span className="eyebrow">在线修改</span>
            <p>当前已经支持在线编辑版本内容。后续可继续扩展差异对比、审批、回滚和评测看板。</p>
          </article>
        </div>
      </section>

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Versions</span>
            <h3>版本列表与在线编辑</h3>
          </div>
          <p>版本是 Skills 的核心管理单元。项目绑定使用的是版本，而不是直接使用 Skill 定义。</p>
        </div>
        <div className="review-stack">
          {versions.length > 0 ? (
            versions.map((version) => (
              <article className="data-card" key={version.id}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">v{version.versionNo}</span>
                    <h3>{version.versionLabel}</h3>
                  </div>
                  <span className="status-pill">{version.status}</span>
                </div>
                <form action={updateVersionAction} className="review-stack">
                  <input type="hidden" name="versionId" value={String(version.id)} />
                  <div className="form-grid">
                    <label className="form-field">
                      <span>版本标签</span>
                      <input className="field-input" name="versionLabel" defaultValue={version.versionLabel} />
                    </label>
                    <label className="form-field">
                      <span>状态</span>
                      <input className="field-input" name="status" defaultValue={version.status} />
                    </label>
                    <label className="form-field">
                      <span>维护者</span>
                      <input className="field-input" name="createdBy" defaultValue={version.createdBy} />
                    </label>
                    <label className="form-field">
                      <span>Storage URI</span>
                      <input className="field-input" name="storageUri" defaultValue={version.storageUri ?? ""} />
                    </label>
                    <label className="form-field">
                      <span>Scenario Taxonomy</span>
                      <input
                        className="field-input"
                        name="scenarioTaxonomy"
                        defaultValue={version.scenarioTaxonomy.join(", ")}
                      />
                    </label>
                    <label className="form-field">
                      <span>Review Checklist</span>
                      <input
                        className="field-input"
                        name="reviewChecklist"
                        defaultValue={version.reviewChecklist.join(", ")}
                      />
                    </label>
                    <label className="form-field">
                      <span>Coverage Dimensions</span>
                      <input
                        className="field-input"
                        name="coverageDimensions"
                        defaultValue={version.coverageDimensions.join(", ")}
                      />
                    </label>
                    <label className="form-field">
                      <span>Evidence Policy</span>
                      <input className="field-input" name="evidencePolicy" defaultValue={version.evidencePolicy} />
                    </label>
                    <label className="form-field">
                      <span>Prompt Template</span>
                      <textarea
                        className="field-input"
                        name="promptTemplate"
                        rows={8}
                        defaultValue={version.promptTemplate}
                      />
                    </label>
                    <label className="form-field">
                      <span>Change Log</span>
                      <textarea
                        className="field-input"
                        name="changeLog"
                        rows={3}
                        defaultValue={version.changeLog ?? ""}
                      />
                    </label>
                    <label className="form-field">
                      <span>Release Notes</span>
                      <textarea
                        className="field-input"
                        name="releaseNotes"
                        rows={3}
                        defaultValue={version.releaseNotes ?? ""}
                      />
                    </label>
                  </div>
                  <div className="project-context-actions">
                    <button className="button-secondary" type="submit">
                      保存版本内容
                    </button>
                  </div>
                </form>
                {version.status === "production" ? null : (
                  <div className="project-context-actions">
                    <SkillVersionPublishAction
                      action={publishVersionAction}
                      versionId={String(version.id)}
                      versionLabel={version.versionLabel}
                    />
                    <SkillVersionRollbackAction
                      action={rollbackVersionAction}
                      versionId={String(version.id)}
                      versionLabel={version.versionLabel}
                    />
                  </div>
                )}
              </article>
            ))
          ) : (
            <p>当前还没有版本，请先返回 Skills 列表页新增一个版本草稿。</p>
          )}
        </div>
      </section>

      {productionVersion ? (
        <section className="data-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Production Snapshot</span>
              <h3>当前生产版本摘要</h3>
            </div>
            <p>让产品、测试和平台管理员快速理解项目实际绑定时会使用哪套规则。</p>
          </div>
          <div className="review-stack">
            <article className="review-meta-card">
              <span className="eyebrow">Prompt Template</span>
              <p>{productionVersion.promptTemplate}</p>
            </article>
            <article className="review-meta-card">
              <span className="eyebrow">Review Checklist</span>
              <p>{productionVersion.reviewChecklist.join(" / ")}</p>
            </article>
            <article className="review-meta-card">
              <span className="eyebrow">Coverage Dimensions</span>
              <p>{productionVersion.coverageDimensions.join(" / ")}</p>
            </article>
            <article className="review-meta-card">
              <span className="eyebrow">Evidence Policy</span>
              <p>{productionVersion.evidencePolicy}</p>
            </article>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
