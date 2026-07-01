import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../components/app-shell";
import { SkillRowActions } from "../../components/skill-row-actions";
import { SkillsPageActions } from "../../components/skills-page-actions";
import {
  createGlobalSkillLibraryItem,
  createGlobalSkillVersion,
  listGlobalSkillLibrary,
  listGlobalSkillVersions,
} from "../../lib/api";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../lib/i18n";

type SkillsPageProps = Readonly<{
  searchParams?: Promise<LocaleSearchParams & { category?: string; status?: string; q?: string }>;
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

function matchesFilter(value: string, expected: string) {
  return expected === "all" || value === expected;
}

export default async function SkillsPage({ searchParams }: SkillsPageProps = {}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = normalizeLocale(resolvedSearchParams.lang);
  const categoryFilter = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "all";
  const statusFilter = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "all";
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim().toLowerCase() : "";

  const skillsResult = await listGlobalSkillLibrary();
  const skills = skillsResult.kind === "success" ? skillsResult.data : [];
  const versionResults = await Promise.all(
    skills.map(async (skill) => ({
      skillId: String(skill.id),
      versions: await listGlobalSkillVersions(String(skill.id)),
    })),
  );

  async function createSkillAction(formData: FormData) {
    "use server";

    await createGlobalSkillLibraryItem({
      skill_key: readFormText(formData, "skillKey"),
      name: readFormText(formData, "name"),
      description: readFormText(formData, "description"),
      category: readFormText(formData, "category"),
      domain: readFormText(formData, "domain"),
      input_types: readCommaList(formData, "inputTypes"),
      owner: readFormText(formData, "owner") || "workspace",
    });
    revalidatePath("/skills");
  }

  async function createVersionAction(formData: FormData) {
    "use server";

    const skillId = readFormText(formData, "skillId");
    await createGlobalSkillVersion(skillId, {
      version_label: readFormText(formData, "versionLabel") || "v1 Draft",
      prompt_template: readFormText(formData, "promptTemplate") || "Write an evidence-based testing prompt.",
      scenario_taxonomy: readCommaList(formData, "scenarioTaxonomy"),
      review_checklist: readCommaList(formData, "reviewChecklist"),
      coverage_dimensions: readCommaList(formData, "coverageDimensions"),
      evidence_policy:
        readFormText(formData, "evidencePolicy") || "Only derive cases from explicit evidence and mark ambiguities.",
      storage_uri: readFormText(formData, "storageUri") || null,
      change_log: readFormText(formData, "changeLog") || null,
      release_notes: readFormText(formData, "releaseNotes") || null,
      created_by: readFormText(formData, "createdBy") || "workspace",
      status: "draft",
    });
    revalidatePath("/skills");
    revalidatePath(`/skills/${skillId}`);
  }

  const skillRows = skills
    .map((skill) => {
      const versionsResult = versionResults.find((item) => item.skillId === String(skill.id))?.versions;
      const versions = versionsResult?.kind === "success" ? versionsResult.data : [];
      const draftCount = versions.filter((version) => version.status === "draft").length;
      return {
        skill,
        versions,
        draftCount,
      };
    })
    .filter(({ skill }) => {
      const matchesCategory = matchesFilter(skill.category, categoryFilter);
      const hasProduction = skill.currentProductionVersionId !== null;
      const normalizedStatus = hasProduction ? "published" : "draft-only";
      const matchesStatus = matchesFilter(normalizedStatus, statusFilter);
      const keyword = [skill.name, skill.skillKey, skill.description, skill.domain, skill.category]
        .join(" ")
        .toLowerCase();
      const matchesQuery = query.length === 0 || keyword.includes(query);
      return matchesCategory && matchesStatus && matchesQuery;
    })
    .sort((left, right) => {
      return right.skill.updatedAt.localeCompare(left.skill.updatedAt);
    });

  const categories = Array.from(new Set(skills.map((skill) => skill.category))).sort();
  const publishedCount = skills.filter((skill) => skill.currentProductionVersionId !== null).length;
  const draftOnlyCount = skills.length - publishedCount;

  return (
    <AppShell currentPath="/skills" locale={locale} contentWidth="wide">
      <section className="page-header">
        <span className="eyebrow">Skills</span>
        <h2>Skills</h2>
        <p>平台级共享测试生成技能目录。列表页负责查找与进入，版本编辑、发布与回滚统一放到详情页处理。</p>
      </section>

      <section className="data-card skills-directory-card">
        <div className="skills-directory-toolbar">
          <div className="skills-directory-copy">
            <span className="eyebrow">Catalog</span>
            <h3>Skill 目录</h3>
            <p>最近更新 · 共 {skillRows.length} 个，已发布 {publishedCount} 个，仅草稿 {draftOnlyCount} 个</p>
          </div>
          <SkillsPageActions
            helpContent={
              <>
                <p>上传方式：当前支持直接在平台创建 Skill，并在版本里登记 Git、OSS、Zip 或文档归档地址。</p>
                <p>更新方式：不要直接覆盖生产规则，应新建版本草稿，修改后再发布，由项目按需切换绑定版本。</p>
                <p>在线修改：目录页负责创建与进入详情，详细编辑、发布与回滚统一在 Skill 详情页完成。</p>
              </>
            }
            createForm={
              <form action={createSkillAction} className="form-grid">
                <label className="form-field">
                  <span>Skill Key</span>
                  <input className="field-input" name="skillKey" placeholder="prd_rules_core_v2" />
                </label>
                <label className="form-field">
                  <span>名称</span>
                  <input className="field-input" name="name" placeholder="PRD + 业务规则增强模板" />
                </label>
                <label className="form-field">
                  <span>分类</span>
                  <input className="field-input" name="category" placeholder="core" />
                </label>
                <label className="form-field">
                  <span>领域</span>
                  <input className="field-input" name="domain" placeholder="general" />
                </label>
                <label className="form-field">
                  <span>输入类型</span>
                  <input className="field-input" name="inputTypes" placeholder="prd, business_rule, swagger" />
                </label>
                <label className="form-field">
                  <span>维护者</span>
                  <input className="field-input" name="owner" placeholder="workspace" />
                </label>
                <label className="form-field">
                  <span>描述</span>
                  <textarea
                    className="field-input"
                    name="description"
                    rows={4}
                    placeholder="说明这套 Skill 擅长覆盖哪些测试场景，以及不适合哪些系统。"
                  />
                </label>
                <button className="primary-button" type="submit">
                  新建 Skill
                </button>
              </form>
            }
          />
        </div>

        <form action="/skills" className="skills-filter-toolbar">
          <input type="hidden" name="lang" value={locale} />
          <label className="form-field skills-search-field">
            <span className="sr-only">搜索 Skill</span>
            <input className="field-input" name="q" defaultValue={query} placeholder="搜索 Skill：名称、Key、描述、领域" />
          </label>
          <label className="form-field skills-filter-chip">
            <span>分类</span>
            <select className="field-input" name="category" defaultValue={categoryFilter}>
              <option value="all">全部分类</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field skills-filter-chip">
            <span>状态</span>
            <select className="field-input" name="status" defaultValue={statusFilter}>
              <option value="all">全部状态</option>
              <option value="published">已有生产版本</option>
              <option value="draft-only">仅草稿</option>
            </select>
          </label>
          <details className="skills-more-filters">
            <summary className="button-secondary">更多筛选</summary>
            <div className="skills-more-filters-panel">
              <label className="form-field">
                <span>排序</span>
                <input className="field-input" value="最近更新优先" readOnly />
              </label>
              <p className="helper-text">当前默认按最近更新时间排序，无需额外切换。</p>
            </div>
          </details>
          <button className="button-secondary" type="submit">
            筛选
          </button>
        </form>
      </section>

      {skillsResult.kind === "http-error" ? (
        <section>
          <p>Skills 暂时不可用，API 返回了错误。</p>
        </section>
      ) : null}

      {skillsResult.kind === "unavailable" ? (
        <section>
          <p>Skills 暂时不可用，当前无法加载共享技能库。</p>
        </section>
      ) : null}

      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Library</span>
            <h3>Skill 列表</h3>
          </div>
          <p>首屏优先展示可操作列表，帮助、创建和低频筛选都收纳在上方工具条中。</p>
        </div>
        {skillRows.length === 0 ? (
          <article className="empty-card">
            <h3>没有匹配的 Skill</h3>
            <p>可以调整筛选条件，或直接创建新的共享 Skill。</p>
          </article>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>分类 / 输入</th>
                  <th>状态</th>
                  <th>当前生产版本</th>
                  <th>草稿版本</th>
                  <th>最近更新</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {skillRows.map(({ skill, draftCount }) => (
                  <tr key={skill.id}>
                    <td>
                      <strong>{skill.name}</strong>
                      <div>{skill.skillKey}</div>
                      <div>{skill.description}</div>
                    </td>
                    <td>
                      <div>{skill.category}</div>
                      <div>{skill.inputTypes.join(" / ") || "-"}</div>
                    </td>
                    <td>{skill.currentProductionVersionId !== null ? "生产中" : "仅草稿"}</td>
                    <td>{skill.currentProductionVersionLabel ?? "未发布"}</td>
                    <td>{draftCount}</td>
                    <td>{skill.updatedAt}</td>
                    <td>
                      <SkillRowActions
                        detailHref={localizedHref(`/skills/${skill.id}`, locale)}
                        primaryLabel={skill.currentProductionVersionId === null ? "创建首个版本" : "新建版本"}
                        form={
                          <form action={createVersionAction} className="review-stack">
                            <input type="hidden" name="skillId" value={String(skill.id)} />
                            <label className="form-field">
                              <span>版本标签</span>
                              <input className="field-input" name="versionLabel" placeholder="v2 Draft" />
                            </label>
                            <label className="form-field">
                              <span>归档地址</span>
                              <input className="field-input" name="storageUri" placeholder="oss://skills/skill/v2.zip" />
                            </label>
                            <label className="form-field">
                              <span>维护者</span>
                              <input className="field-input" name="createdBy" placeholder="workspace" />
                            </label>
                            <label className="form-field">
                              <span>Scenario Taxonomy</span>
                              <input className="field-input" name="scenarioTaxonomy" placeholder="happy_path, recovery" />
                            </label>
                            <label className="form-field">
                              <span>Review Checklist</span>
                              <input className="field-input" name="reviewChecklist" placeholder="traceable, observable" />
                            </label>
                            <label className="form-field">
                              <span>Coverage Dimensions</span>
                              <input className="field-input" name="coverageDimensions" placeholder="core_user_journey, exception_flow" />
                            </label>
                            <label className="form-field">
                              <span>Evidence Policy</span>
                              <input className="field-input" name="evidencePolicy" placeholder="Only derive cases from explicit evidence." />
                            </label>
                            <label className="form-field">
                              <span>Prompt Template</span>
                              <textarea className="field-input" name="promptTemplate" rows={4} placeholder="Write a strict, evidence-based testing prompt here." />
                            </label>
                            <label className="form-field">
                              <span>Change Log</span>
                              <textarea className="field-input" name="changeLog" rows={2} placeholder="说明本次修改点。" />
                            </label>
                            <label className="form-field">
                              <span>Release Notes</span>
                              <textarea className="field-input" name="releaseNotes" rows={2} placeholder="说明本版适用范围。" />
                            </label>
                            <button className="button-secondary" type="submit">
                              保存草稿版本
                            </button>
                          </form>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
