import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../components/app-shell";
import { SkillBindingsPanel } from "../../../components/skill-bindings-panel";
import { SkillDetailTabs } from "../../../components/skill-detail-tabs";
import { SkillEvalPanel } from "../../../components/skill-eval-panel";
import { SkillForkDraftForm } from "../../../components/skill-fork-draft-form";
import { SkillProductionPreview } from "../../../components/skill-production-preview";
import { SkillSettingsForm } from "../../../components/skill-settings-form";
import { SkillVersionDiff } from "../../../components/skill-version-diff";
import { SkillVersionTimeline } from "../../../components/skill-version-timeline";
import {
  createGlobalSkillVersion,
  getGlobalSkillLibraryItem,
  getGlobalSkillUsageStats,
  listGlobalSkillProjectBindings,
  listGlobalSkillVersions,
  updateGlobalSkillLibraryItem,
} from "../../../lib/api";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../lib/i18n";
import { formatSkillCategory, formatSkillDomain } from "../../../lib/skill-copy";
import {
  isDefaultSkillName,
  isMeaningfulSkillDescription,
} from "../../../lib/skill-content-utils";

type SkillDetailPageProps = Readonly<{
  params: Promise<{ skillId: string }>;
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
  const [skillResult, versionsResult, bindingsResult, statsResult] = await Promise.all([
    getGlobalSkillLibraryItem(skillId),
    listGlobalSkillVersions(skillId),
    listGlobalSkillProjectBindings(skillId),
    getGlobalSkillUsageStats(skillId),
  ]);

  if (skillResult.kind !== "success") {
    return (
      <AppShell currentPath="/skills" locale={locale} contentWidth="wide">
        <section className="page-header">
          <span className="eyebrow">技能中心</span>
          <h2>技能详情不可用</h2>
          <p>当前无法加载所选 Skill。</p>
          <a className="button-secondary" href={localizedHref("/skills", locale)}>
            返回技能库
          </a>
        </section>
      </AppShell>
    );
  }

  const skill = skillResult.data;
  const versions = versionsResult.kind === "success" ? versionsResult.data : [];
  const bindings = bindingsResult.kind === "success" ? bindingsResult.data : [];
  const stats =
    statsResult.kind === "success"
      ? statsResult.data
      : {
          boundProjectCount: 0,
          generationTaskCount: 0,
          succeededGenerationCount: 0,
          failedGenerationCount: 0,
          latestGenerationAt: null,
          draftVersionCount: 0,
          productionVersionLabel: null,
        };
  const productionVersion =
    versions.find((item) => item.status === "production") ??
    (skill.currentProductionVersionId !== null
      ? versions.find((item) => String(item.id) === String(skill.currentProductionVersionId))
      : null) ??
    null;

  async function updateSkillAction(formData: FormData) {
    "use server";

    await updateGlobalSkillLibraryItem(skillId, {
      name: readFormText(formData, "name"),
      description: readFormText(formData, "description"),
      category: readFormText(formData, "category"),
      domain: readFormText(formData, "domain"),
      input_types: readCommaList(formData, "inputTypes"),
      status: readFormText(formData, "status") || undefined,
    });
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function forkProductionDraftAction(formData: FormData) {
    "use server";

    const changeLog = readFormText(formData, "changeLog");
    if (!changeLog) {
      return;
    }

    const latestVersions = await listGlobalSkillVersions(skillId);
    const currentVersions = latestVersions.kind === "success" ? latestVersions.data : [];
    const source =
      currentVersions.find((item) => item.status === "production") ?? currentVersions[0];

    if (!source) {
      return;
    }

    const created = await createGlobalSkillVersion(skillId, {
      version_label: `v${currentVersions.length + 1} 草稿`,
      prompt_template: source.promptTemplate,
      scenario_taxonomy: source.scenarioTaxonomy,
      review_checklist: source.reviewChecklist,
      coverage_dimensions: source.coverageDimensions,
      evidence_policy: source.evidencePolicy,
      storage_uri: source.storageUri,
      change_log: changeLog,
      release_notes: null,
      created_by: "workspace",
      status: "draft",
    });

    if (created.kind === "success") {
      revalidatePath(`/skills/${skillId}`);
      redirect(localizedHref(`/skills/${skillId}/versions/${created.data.id}`, locale));
    }
  }

  const forkDraftForm =
    productionVersion !== null ? (
      <SkillForkDraftForm action={forkProductionDraftAction} sourceLabel={productionVersion.versionLabel} />
    ) : null;

  return (
    <AppShell currentPath={`/skills/${skillId}`} locale={locale} contentWidth="wide">
      <section className="page-header skills-page-header skill-detail-hero">
        <div className="skills-detail-breadcrumb">
          <a className="table-link" href={localizedHref("/skills", locale)}>
            ← 返回技能库
          </a>
        </div>
        <div className="skill-detail-hero-main">
          <div>
            <span className="eyebrow">{skill.skillKey}</span>
            <h2>{isDefaultSkillName(skill.name) ? skill.skillKey : skill.name}</h2>
            {isMeaningfulSkillDescription(skill.description) ? <p>{skill.description}</p> : null}
          </div>
          <div className="skill-detail-hero-meta">
            <span>{formatSkillCategory(skill.category)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatSkillDomain(skill.domain)}</span>
            <span aria-hidden="true">·</span>
            <span>{skill.currentProductionVersionLabel ?? "未发布"}</span>
          </div>
        </div>
      </section>

      <SkillDetailTabs
        preview={
          <section className="data-card skill-preview-card">
            <SkillProductionPreview
              skill={skill}
              version={productionVersion}
              forkDraftAction={forkDraftForm}
            />
          </section>
        }
        versions={
          <div className="skill-versions-stack">
            <section className="data-card">
              <SkillVersionTimeline
                skillId={skillId}
                locale={locale}
                versions={versions}
                createDraftAction={forkDraftForm}
              />
            </section>
            <section className="data-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">版本对比</span>
                  <h3>差异查看</h3>
                </div>
                <p>对比两个版本的提示词与证据策略差异。</p>
              </div>
              <SkillVersionDiff versions={versions} />
            </section>
          </div>
        }
        bindings={
          <section className="data-card">
            <SkillBindingsPanel locale={locale} bindings={bindings} />
          </section>
        }
        evalPanel={
          <section className="data-card">
            <SkillEvalPanel stats={stats} versions={versions} />
          </section>
        }
        settings={
          <section className="data-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">目录信息</span>
                <h3>Skill 元数据</h3>
              </div>
              <p>仅维护名称、分类和适用范围。生成规则请在版本草稿中修改。</p>
            </div>
            <SkillSettingsForm skill={skill} updateAction={updateSkillAction} />
          </section>
        }
      />
    </AppShell>
  );
}
