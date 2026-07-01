import React from "react";
import { revalidatePath } from "next/cache";

import { AppShell } from "../../../../components/app-shell";
import { GenerationTaskList } from "../../../../components/generation-task-list";
import { ProjectArchiveBanner } from "../../../../components/project-archive-banner";
import { copy as uiCopy } from "../../../../lib/copy";
import {
  createGenerationTask,
  getProject,
  listDocumentVersions,
  listProjectSkillBindings,
  listProjectDocuments,
  listProjectGenerationTasks,
  listProjectSkillPackages,
  listProjectTestCases,
} from "../../../../lib/api";
import { copy, localizedHref, normalizeLocale, type LocaleSearchParams } from "../../../../lib/i18n";
import { translateProjectName } from "../../../../lib/project-display";

type ProjectGenerationTasksPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<LocaleSearchParams>;
};

function parseSearchParam(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => item.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export default async function ProjectGenerationTasksPage({
  params,
  searchParams,
}: ProjectGenerationTasksPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams =
    ((await searchParams) ?? {}) as LocaleSearchParams & {
      documentIds?: string | string[];
    };
  const locale = normalizeLocale(resolvedSearchParams.lang);
  const t = copy[locale];
  const projectResult = await getProject(projectId);

  if (projectResult.kind === "not-found") {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.generationPage.eyebrow}</span>
          <h2>{t.states.projectNotFound}</h2>
          <p>{t.states.projectNotFoundCopy}</p>
        </section>
      </AppShell>
    );
  }

  if (projectResult.kind === "http-error") {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.generationPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiError}</p>
        </section>
      </AppShell>
    );
  }

  const project = projectResult.project;

  if (project === null) {
    return (
      <AppShell currentPath={`/projects/${projectId}/generation-tasks`} locale={locale}>
        <section className="page-header">
          <span className="eyebrow">{t.generationPage.eyebrow}</span>
          <h2>{t.states.projectUnavailable}</h2>
          <p>{t.states.apiUnavailable}</p>
        </section>
      </AppShell>
    );
  }

  const projectDisplayName = translateProjectName(project.name, locale);
  const archived = project.status === "archived";

  const [taskList, documentList, bindingsResult, skillPackagesResult, testCaseList] = await Promise.all([
    listProjectGenerationTasks(projectId),
    listProjectDocuments(projectId),
    listProjectSkillBindings(projectId),
    listProjectSkillPackages(projectId),
    listProjectTestCases(projectId),
  ]);
  const tasks = taskList.kind === "http-error" ? [] : taskList.tasks;
  const documents = documentList.kind === "success" ? documentList.documents : [];
  const versionResults = await Promise.all(
    documents.map(async (document) => ({
      documentId: String(document.id),
      versions: await listDocumentVersions(String(document.id)),
    })),
  );
  const bindings = bindingsResult.kind === "success" ? bindingsResult.data : [];
  const skillPackages = skillPackagesResult.kind === "success" ? skillPackagesResult.data : [];
  const activeSkillPackages = skillPackages.filter((item) => item.activeVersionId);
  const preferredBindings = bindings.filter((item) => item.status === "active");
  const seedCases = testCaseList.kind === "success" ? testCaseList.items : [];
  const selectedDocumentIds = new Set(parseSearchParam(resolvedSearchParams.documentIds));
  const preselectedVersionIds = new Set(
    versionResults
      .flatMap((item) => {
        if (!selectedDocumentIds.has(item.documentId) || item.versions.kind !== "success") {
          return [];
        }

        const latestVersion = [...item.versions.data].sort((left, right) => {
          return right.versionNo - left.versionNo;
        })[0];

        return latestVersion ? [String(latestVersion.id)] : [];
      }),
  );

  async function createGenerationAction(formData: FormData) {
    "use server";

    const read = (name: string) => {
      const value = formData.get(name);
      return typeof value === "string" ? value.trim() : "";
    };
    const inputDocumentVersionIds = formData
      .getAll("documentVersionId")
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
    const seedTestCaseIds = formData
      .getAll("seedTestCaseId")
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
    const inputSkillVersionId = Number.parseInt(read("skillVersionId"), 10);
    const inputSkillBindingId = Number.parseInt(read("skillBindingId"), 10);
    const provider = read("provider");
    const model = read("model");
    const promptProfile = read("promptProfile");
    const coverageGapNote = read("coverageGapNote");

    await createGenerationTask(projectId, {
      input_document_version_ids: inputDocumentVersionIds,
      input_skill_version_id: Number.isInteger(inputSkillVersionId) ? inputSkillVersionId : null,
      input_skill_binding_id: Number.isInteger(inputSkillBindingId) ? inputSkillBindingId : null,
      seed_test_case_ids: seedTestCaseIds,
      coverage_gap_note: coverageGapNote || null,
      provider: provider || null,
      model: model || null,
      prompt_profile: promptProfile || null,
    });
    revalidatePath(`/projects/${projectId}/generation-tasks`);
  }

  return (
    <AppShell
      currentPath={`/projects/${projectId}/generation-tasks`}
      locale={locale}
      project={project}
    >
      <section className="page-header">
        <span className="eyebrow">{t.generationPage.eyebrow}</span>
        <h2>生成任务</h2>
        <p>当前项目：{projectDisplayName}。{t.generationPage.description}</p>
      </section>

      <section className="summary-grid" aria-label={t.generationPage.summary}>
        <article className="summary-card">
          <span className="eyebrow">{t.generationPage.tasks}</span>
          <p className="summary-value">
            {taskList.kind === "http-error" ? t.states.unavailable : tasks.length}
          </p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.generationPage.defaultProvider}</span>
          <p className="summary-value">{project.defaultProvider}</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">{t.generationPage.promptProfile}</span>
          <p className="summary-value">{project.defaultPromptProfile}</p>
        </article>
      </section>

      <section className="data-card generation-create-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Generation Inputs</span>
            <h3>快速发起生成</h3>
          </div>
          <p>默认主链路只保留文档、项目技能和覆盖说明。Provider、模型和参考用例等高级配置按需展开，减少首屏决策成本。</p>
        </div>

        <form action={createGenerationAction} className="review-stack generation-create-form">
          <div className="review-stack">
            <div>
              <h4>文档版本</h4>
              {documents.length === 0 ? (
                <p>还没有可选文档，请先上传并生成版本。</p>
              ) : (
                documents.map((document) => {
                  const versionResult = versionResults.find(
                    (item) => item.documentId === String(document.id),
                  )?.versions;
                  const versions = versionResult?.kind === "success" ? versionResult.data : [];
                  return (
                    <article className="data-card" key={document.id}>
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">{document.type}</span>
                          <h4>{document.name}</h4>
                        </div>
                        <span className="status-pill">{document.parseStatus ?? "pending"}</span>
                      </div>
                      {versions.length > 0 ? (
                        <div className="review-stack">
                          {versions.map((version) => (
                            <label className="inline-check" key={version.id}>
                              <input
                                type="checkbox"
                                name="documentVersionId"
                                value={String(version.id)}
                                defaultChecked={
                                  selectedDocumentIds.size > 0
                                    ? preselectedVersionIds.has(String(version.id))
                                    : version.parseStatus === "parsed"
                                }
                                disabled={archived}
                              />
                              <span>
                                v{version.versionNo} · {version.parseStatus} ·{" "}
                                {version.parseSummary ?? "No parse summary yet"}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p>暂无版本。</p>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            <div>
              <h4>已选生成技能</h4>
              {preferredBindings.length > 0 ? (
                <div className="review-stack">
                  {preferredBindings.map((binding, index) => (
                    <label className="inline-check" key={binding.id}>
                      <input
                        type="radio"
                        name="skillBindingId"
                        value={String(binding.id)}
                        defaultChecked={binding.isDefault || index === 0}
                        disabled={archived}
                      />
                      <span>
                        {binding.skillName} · {binding.versionLabel}
                        {binding.isDefault ? " · 默认" : ""}
                        {binding.bindingType === "supplement" ? " · 补场景专项" : ""}
                        {binding.bindingType === "api" ? " · API 专项" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              ) : activeSkillPackages.length === 0 ? (
                <p>当前没有已绑定的共享技能，也没有已激活的本地 Skill 版本，请先到项目技能页配置。</p>
              ) : (
                <div className="review-stack">
                  <p>当前项目还没有绑定共享技能，以下使用本地兼容包作为回退方案。</p>
                  {activeSkillPackages.map((skillPackage, index) => (
                    <label className="inline-check" key={skillPackage.id}>
                      <input
                        type="radio"
                        name="skillVersionId"
                        value={String(skillPackage.activeVersionId)}
                        defaultChecked={index === 0}
                        disabled={archived}
                      />
                      <span>
                        {skillPackage.name} · {skillPackage.activeVersionSummary ?? "已激活版本"} · 本地兼容
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>补充覆盖说明</span>
              <textarea
                className="field-input"
                name="coverageGapNote"
                placeholder="例如：补充退款失败后的回滚、消息通知、审计日志与权限校验场景。"
                disabled={archived}
                rows={4}
              />
            </label>
          </div>
          <details>
            <summary className="button-secondary">高级选项</summary>
            <div className="review-stack" style={{ marginTop: "1rem" }}>
              <div className="form-grid">
                <label className="form-field">
                  <span>{t.generationPage.provider}</span>
                  <select className="field-input" name="provider" defaultValue="" disabled={archived}>
                    <option value="">{t.generationPage.projectDefault}</option>
                    <option value="cursor">Cursor</option>
                    <option value="openai">OpenAI</option>
                    <option value="mock">Mock</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>{t.generationPage.model}</span>
                  <input
                    className="field-input"
                    name="model"
                    placeholder={project.defaultProvider}
                    disabled={archived}
                  />
                </label>
                <label className="form-field">
                  <span>{t.generationPage.promptProfile}</span>
                  <input
                    className="field-input"
                    name="promptProfile"
                    placeholder={project.defaultPromptProfile}
                    disabled={archived}
                  />
                </label>
              </div>

              <div>
                <h4>参考现有用例</h4>
                <p>选择已有用例作为补生成参考，让 AI 聚焦补全缺失场景，而不是从头改写整批草稿。</p>
                {seedCases.length === 0 ? (
                  <p>当前还没有可用的参考用例，可直接填写覆盖缺口说明。</p>
                ) : (
                  <div className="review-stack">
                    {seedCases.map((testCase) => (
                      <label className="inline-check" key={testCase.id}>
                        <input
                          type="checkbox"
                          name="seedTestCaseId"
                          value={String(testCase.id)}
                          disabled={archived}
                        />
                        <span>
                          {testCase.title} · {testCase.module} / {testCase.feature}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>
          {archived ? (
            <div className="archived-action-lock">{uiCopy.archivedProjectActionHint}</div>
          ) : (
            <button
              className="primary-button"
              type="submit"
              disabled={
                documents.length === 0 ||
                (preferredBindings.length === 0 && activeSkillPackages.length === 0)
              }
            >
              {t.generationPage.queueGeneration}
            </button>
          )}
        </form>
      </section>

      {taskList.kind === "unavailable" ? (
        <section>
          <p>{t.generationPage.fallback}</p>
        </section>
      ) : null}

      {taskList.kind === "http-error" ? (
        <section>
          <p>{t.generationPage.error}</p>
        </section>
      ) : null}

      {archived ? <ProjectArchiveBanner /> : null}

      <GenerationTaskList items={tasks} locale={locale} />

      <section className="workspace-links" aria-label={t.generationPage.followUp}>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/documents`, locale)}
        >
          <span className="eyebrow">{t.generationPage.inputs}</span>
          <h3>{t.generationPage.documentCenter}</h3>
          <p>{t.generationPage.inputsCopy}</p>
        </a>
        <a className="workspace-link" href={localizedHref(`/projects/${projectId}/skills`, locale)}>
          <span className="eyebrow">Skills</span>
          <h3>项目技能</h3>
          <p>维护共享技能绑定与本地兼容包，决定当前项目生成测试用例时使用哪套规则。</p>
        </a>
        <a
          className="workspace-link"
          href={localizedHref(`/projects/${projectId}/review`, locale)}
        >
          <span className="eyebrow">{t.generationPage.laterTask}</span>
          <h3>{t.generationPage.reviewWorkspace}</h3>
          <p>{t.generationPage.reviewCopy}</p>
        </a>
      </section>
    </AppShell>
  );
}
