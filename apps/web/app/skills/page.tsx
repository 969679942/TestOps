import React from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../components/app-shell";
import { PageDescription } from "../../components/page-description";
import { SkillRowActions } from "../../components/skill-row-actions";
import { SkillsPageActions } from "../../components/skills-page-actions";
import {
  createGlobalSkillLibraryItem,
  createGlobalSkillVersion,
  listGlobalSkillLibrary,
  listGlobalSkillVersions,
} from "../../lib/api";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../lib/i18n";
import {
  formatSkillCategory,
  formatSkillDomain,
  formatSkillInputTypes,
  formatSkillStatus,
  skillFieldLabels,
} from "../../lib/skill-copy";
import { buildSkillCreatePayload } from "../../lib/skill-form-validation";
import {
  serializeSkillImportForApi,
  type SkillMarkdownImportRecord,
} from "../../lib/skill-markdown-import";
import {
  DEFAULT_SKILL_EVIDENCE_POLICY,
  DEFAULT_SKILL_PROMPT_TEMPLATE,
  isMeaningfulSkillDescription,
  truncateSkillPreview,
} from "../../lib/skill-content-utils";

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

    const result = await createGlobalSkillLibraryItem(buildSkillCreatePayload(formData));
    if (result.kind !== "success") {
      throw new Error(
        result.kind === "http-error"
          ? (result.message ?? "创建 Skill 失败。")
          : "技能库服务暂时不可用。",
      );
    }

    const skillId = String(result.data.id);
    const versionResult = await createGlobalSkillVersion(skillId, {
      version_label: "v1 草稿",
      prompt_template: readFormText(formData, "promptTemplate") || DEFAULT_SKILL_PROMPT_TEMPLATE,
      scenario_taxonomy: [],
      review_checklist: ["traceable"],
      coverage_dimensions: ["core_user_journey"],
      evidence_policy: readFormText(formData, "evidencePolicy") || DEFAULT_SKILL_EVIDENCE_POLICY,
      storage_uri: null,
      change_log: "初始创建",
      release_notes: null,
      created_by: "workspace",
      status: "draft",
    });

    if (versionResult.kind !== "success") {
      throw new Error(
        versionResult.kind === "http-error"
          ? (versionResult.message ?? "创建 Skill 版本失败。")
          : "技能库服务暂时不可用。",
      );
    }

    revalidatePath("/skills");
    revalidatePath(`/skills/${skillId}`);
    redirect(localizedHref(`/skills/${skillId}/versions/${versionResult.data.id}`, locale));
  }

  async function createVersionAction(formData: FormData) {
    "use server";

    const skillId = readFormText(formData, "skillId");
    const result = await createGlobalSkillVersion(skillId, {
      version_label: readFormText(formData, "versionLabel") || "v1 Draft",
      prompt_template: readFormText(formData, "promptTemplate") || DEFAULT_SKILL_PROMPT_TEMPLATE,
      scenario_taxonomy: readCommaList(formData, "scenarioTaxonomy"),
      review_checklist: readCommaList(formData, "reviewChecklist"),
      coverage_dimensions: readCommaList(formData, "coverageDimensions"),
      evidence_policy: readFormText(formData, "evidencePolicy") || DEFAULT_SKILL_EVIDENCE_POLICY,
      storage_uri: readFormText(formData, "storageUri") || null,
      change_log: "新建版本",
      release_notes: null,
      created_by: "workspace",
      status: "draft",
    });

    if (result.kind !== "success") {
      throw new Error(
        result.kind === "http-error"
          ? (result.message ?? "创建版本失败。")
          : "技能库服务暂时不可用。",
      );
    }

    revalidatePath("/skills");
    revalidatePath(`/skills/${skillId}`);
  }

  async function importSkillsAction(formData: FormData) {
    "use server";

    const raw = readFormText(formData, "skillsJson");
    if (!raw) {
      throw new Error("没有可导入的 Skill 数据。");
    }

    let records: SkillMarkdownImportRecord[];
    try {
      records = JSON.parse(raw) as SkillMarkdownImportRecord[];
    } catch {
      throw new Error("导入数据格式无效。");
    }

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error("文件中至少需要 1 条 Skill。");
    }

    let lastSkillId = "";
    let lastVersionId = "";

    for (const record of records) {
      const payload = serializeSkillImportForApi(record);
      const result = await createGlobalSkillLibraryItem({
        skill_key: payload.skill_key,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        domain: payload.domain,
        input_types: payload.input_types,
      });

      if (result.kind !== "success") {
        throw new Error(
          result.kind === "http-error"
            ? (result.message ?? `导入 Skill「${payload.name || payload.skill_key}」失败。`)
            : "技能库服务暂时不可用。",
        );
      }

      const skillId = String(result.data.id);
      const versionResult = await createGlobalSkillVersion(skillId, {
        version_label: "v1 草稿",
        prompt_template: payload.prompt_template,
        scenario_taxonomy: [],
        review_checklist: ["traceable"],
        coverage_dimensions: ["core_user_journey"],
        evidence_policy: payload.evidence_policy,
        storage_uri: null,
        change_log: "Markdown 导入",
        release_notes: null,
        created_by: "workspace",
        status: "draft",
      });

      if (versionResult.kind !== "success") {
        throw new Error(
          versionResult.kind === "http-error"
            ? (versionResult.message ?? `导入 Skill 版本失败：${payload.name || payload.skill_key}。`)
            : "技能库服务暂时不可用。",
        );
      }

      lastSkillId = skillId;
      lastVersionId = String(versionResult.data.id);
    }

    revalidatePath("/skills");
    if (records.length === 1 && lastSkillId && lastVersionId) {
      redirect(localizedHref(`/skills/${lastSkillId}/versions/${lastVersionId}`, locale));
    }
  }

  const skillRows = skills
    .map((skill) => {
      const versionsResult = versionResults.find((item) => item.skillId === String(skill.id))?.versions;
      const versions = versionsResult?.kind === "success" ? versionsResult.data : [];
      const draftCount = versions.filter((version) => version.status === "draft").length;
      const productionVersion =
        versions.find((version) => version.status === "production") ??
        (skill.currentProductionVersionId !== null
          ? versions.find((version) => String(version.id) === String(skill.currentProductionVersionId))
          : null) ??
        versions[0] ??
        null;
      const editableVersion =
        versions.find((version) => version.status === "draft") ??
        productionVersion ??
        versions.at(-1) ??
        null;
      const editHref = editableVersion
        ? localizedHref(`/skills/${skill.id}/versions/${editableVersion.id}`, locale)
        : localizedHref(`/skills/${skill.id}`, locale);
      const contentPreview = editableVersion?.promptTemplate ?? productionVersion?.promptTemplate ?? "";

      return {
        skill,
        versions,
        draftCount,
        productionVersion,
        editableVersion,
        editHref,
        contentPreview,
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
      <section className="page-header skills-page-header">
        <span className="eyebrow">技能中心</span>
        <h2>共享技能库</h2>
        <p>平台级测试生成技能目录。在此查找与预览 Skill，版本编辑、发布与回滚请进入详情页处理。</p>
        <PageDescription page="skillsCenter" />
      </section>

      <section className="data-card skills-directory-card">
        <div className="skills-directory-toolbar">
          <div className="skills-directory-copy">
            <span className="eyebrow">目录</span>
            <h3>Skill 目录</h3>
            <p>最近更新 · 共 {skillRows.length} 个，已发布 {publishedCount} 个，仅草稿 {draftOnlyCount} 个</p>
          </div>
          <SkillsPageActions createAction={createSkillAction} importAction={importSkillsAction} />
        </div>

        <form action="/skills" className="skills-filter-toolbar">
          <input type="hidden" name="lang" value={locale} />
          <label className="form-field skills-filter-field skills-filter-search">
            <span>搜索</span>
            <input
              className="field-input"
              name="q"
              defaultValue={query}
              placeholder="名称、Key、描述、领域"
            />
          </label>
          <label className="form-field skills-filter-field">
            <span>分类</span>
            <select className="field-input" name="category" defaultValue={categoryFilter}>
              <option value="all">全部分类</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatSkillCategory(category)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field skills-filter-field">
            <span>状态</span>
            <select className="field-input" name="status" defaultValue={statusFilter}>
              <option value="all">全部状态</option>
              <option value="published">已有生产版本</option>
              <option value="draft-only">仅草稿</option>
            </select>
          </label>
          <div className="skills-filter-actions">
            <span className="skills-filter-actions-spacer" aria-hidden="true">
              操作
            </span>
            <div className="skills-filter-action-row">
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
            </div>
          </div>
        </form>
      </section>

      {skillsResult.kind === "http-error" ? (
        <section>
          <p>技能库暂时不可用，API 返回了错误。</p>
        </section>
      ) : null}

      {skillsResult.kind === "unavailable" ? (
        <section>
          <p>技能库暂时不可用，当前无法加载共享技能库。</p>
        </section>
      ) : null}

      <section className="data-card skills-library-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">技能列表</span>
            <h3>全部 Skill</h3>
          </div>
          <p>首屏展示可操作的技能列表；帮助、创建和筛选收纳在上方工具条。</p>
        </div>
        {skillRows.length === 0 ? (
          <article className="empty-card">
            <h3>没有匹配的 Skill</h3>
            <p>可以调整筛选条件，或直接创建新的共享 Skill。</p>
          </article>
        ) : (
          <div className="table-scroll skills-table-scroll">
            <table className="data-table skills-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>分类 / 输入</th>
                  <th>状态</th>
                  <th>{skillFieldLabels.currentProductionVersion}</th>
                  <th>{skillFieldLabels.draftCount}</th>
                  <th>{skillFieldLabels.updatedAt}</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {skillRows.map(({ skill, draftCount, productionVersion, editHref, contentPreview }) => (
                  <tr key={skill.id}>
                    <td className="skills-table-name">
                      <strong>{skill.name}</strong>
                      <div className="table-detail">
                        <p>{skill.skillKey}</p>
                        {contentPreview ? (
                          <p className="skill-content-preview">{truncateSkillPreview(contentPreview)}</p>
                        ) : (
                          <p className="skill-detail-muted">尚未编写内容</p>
                        )}
                        {isMeaningfulSkillDescription(skill.description) ? (
                          <p>{skill.description}</p>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div>{formatSkillCategory(skill.category)}</div>
                      <div className="table-detail">
                        <p>{formatSkillInputTypes(skill.inputTypes)}</p>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          skill.currentProductionVersionId !== null
                            ? "status-badge--production"
                            : "status-badge--draft"
                        }`}
                      >
                        {skill.currentProductionVersionId !== null ? "已发布" : "仅草稿"}
                      </span>
                    </td>
                    <td>{skill.currentProductionVersionLabel ?? "未发布"}</td>
                    <td>{draftCount}</td>
                    <td>{skill.updatedAt}</td>
                    <td>
                      <SkillRowActions
                        detailHref={localizedHref(`/skills/${skill.id}`, locale)}
                        editHref={editHref}
                        skill={skill}
                        skillId={String(skill.id)}
                        productionVersion={productionVersion}
                        createVersionAction={createVersionAction}
                        primaryLabel={skill.currentProductionVersionId === null ? "创建首个版本" : "新建版本"}
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
