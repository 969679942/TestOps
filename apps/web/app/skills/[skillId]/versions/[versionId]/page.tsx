import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../../components/app-shell";
import { SkillForkDraftForm } from "../../../../../components/skill-fork-draft-form";
import { SkillProductionPreview } from "../../../../../components/skill-production-preview";
import { SkillVersionEditorForm } from "../../../../../components/skill-version-editor-form";
import {
  createGlobalSkillVersion,
  getGlobalSkillLibraryItem,
  listGlobalSkillVersions,
  publishGlobalSkillVersion,
  rollbackGlobalSkillVersion,
  updateGlobalSkillVersion,
} from "../../../../../lib/api";
import { localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../../lib/i18n";
import { formatSkillStatus } from "../../../../../lib/skill-copy";

type SkillVersionPageProps = Readonly<{
  params: Promise<{ skillId: string; versionId: string }>;
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

export default async function SkillVersionPage({ params, searchParams }: SkillVersionPageProps) {
  const { skillId, versionId } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const skillResult = await getGlobalSkillLibraryItem(skillId);
  const versionsResult = await listGlobalSkillVersions(skillId);

  if (skillResult.kind !== "success" || versionsResult.kind !== "success") {
    return (
      <AppShell currentPath="/skills" locale={locale} contentWidth="wide">
        <section className="page-header">
          <span className="eyebrow">技能中心</span>
          <h2>版本不可用</h2>
          <p>当前无法加载所选 Skill 版本。</p>
          <a className="button-secondary" href={localizedHref("/skills", locale)}>
            返回技能库
          </a>
        </section>
      </AppShell>
    );
  }

  const skill = skillResult.data;
  const versions = versionsResult.data;
  const version = versions.find((item) => String(item.id) === String(versionId));

  if (!version) {
    return (
      <AppShell currentPath={`/skills/${skillId}`} locale={locale} contentWidth="wide">
        <section className="page-header">
          <span className="eyebrow">技能中心</span>
          <h2>版本不存在</h2>
          <p>未找到对应版本记录。</p>
          <a className="button-secondary" href={localizedHref(`/skills/${skillId}`, locale)}>
            返回 Skill 详情
          </a>
        </section>
      </AppShell>
    );
  }

  const isDraft = version.status === "draft";

  async function updateVersionAction(formData: FormData) {
    "use server";

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
    });
    revalidatePath(`/skills/${skillId}/versions/${versionId}`);
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function publishVersionAction(formData: FormData) {
    "use server";

    const targetVersionId = readFormText(formData, "versionId");
    const result = await publishGlobalSkillVersion(skillId, targetVersionId);

    if (result.kind !== "success") {
      throw new Error(
        result.kind === "http-error"
          ? (result.message ?? "发布失败。")
          : "技能库服务暂时不可用。",
      );
    }

    revalidatePath(`/skills/${skillId}/versions/${versionId}`);
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function rollbackVersionAction(formData: FormData) {
    "use server";

    const targetVersionId = readFormText(formData, "versionId");
    const result = await rollbackGlobalSkillVersion(skillId, targetVersionId);

    if (result.kind !== "success") {
      throw new Error(
        result.kind === "http-error"
          ? (result.message ?? "回滚失败。")
          : "技能库服务暂时不可用。",
      );
    }

    revalidatePath(`/skills/${skillId}/versions/${versionId}`);
    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");
  }

  async function forkDraftAction(formData: FormData) {
    "use server";

    const changeLog = readFormText(formData, "changeLog");
    if (!changeLog) {
      return;
    }

    const created = await createGlobalSkillVersion(skillId, {
      version_label: `v${versions.length + 1} 草稿`,
      prompt_template: version.promptTemplate,
      scenario_taxonomy: version.scenarioTaxonomy,
      review_checklist: version.reviewChecklist,
      coverage_dimensions: version.coverageDimensions,
      evidence_policy: version.evidencePolicy,
      storage_uri: version.storageUri,
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

  return (
    <AppShell currentPath={`/skills/${skillId}`} locale={locale} contentWidth="wide">
      <section className="page-header skills-page-header">
        <div className="skills-detail-breadcrumb">
          <a className="table-link" href={localizedHref(`/skills/${skillId}`, locale)}>
            ← 返回 {skill.name}
          </a>
        </div>
        <span className="eyebrow">
          v{version.versionNo} · {skill.skillKey}
        </span>
        <h2>{version.versionLabel}</h2>
        <p>
          {isDraft
            ? "草稿版本可编辑。发布后将替换当前生产规则。"
            : "生产版本只读。如需修改，请填写变更说明后新建草稿。"}
        </p>
      </section>

      {isDraft ? (
        <section className="data-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">草稿编辑</span>
              <h3>编辑版本内容</h3>
            </div>
            <span className={`status-badge status-badge--${version.status}`}>
              {formatSkillStatus(version.status)}
            </span>
          </div>
          <SkillVersionEditorForm
            version={version}
            updateAction={updateVersionAction}
            publishAction={publishVersionAction}
            rollbackAction={rollbackVersionAction}
          />
        </section>
      ) : (
        <section className="data-card skill-preview-card">
          <SkillProductionPreview
            skill={skill}
            version={version}
            forkDraftAction={
              <SkillForkDraftForm
                action={forkDraftAction}
                sourceLabel={version.versionLabel}
                buttonLabel="基于此版本新建草稿"
              />
            }
          />
        </section>
      )}
    </AppShell>
  );
}
