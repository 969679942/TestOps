/** Centralized copy from TestOps产品设计规范.md appendices G, H, I */

export const pageDescriptions = {
  projectList:
    "管理测试项目，进入工作区后可上传资料、生成或导入用例，并完成评审与发布。",
  projectWorkspace:
    "承接当前项目的下一步动作。先上传资料或导入用例，再进入编辑与评审。",
  documents:
    "上传 PRD、Swagger 或 Figma 资料。选择文档后可生成测试用例。",
  testCaseList:
    "浏览、筛选并进入用例编辑或评审。左侧目录树可按模块组织用例。",
  testCaseEdit:
    "编辑结构化测试内容。保存后可提交评审；已发布用例的核心字段可能锁定。",
  review: "查看用例内容、填写评审意见，并执行批准、退回、驳回或发布。",
  generationTasks:
    "查看 AI 生成任务状态。失败任务可查看原因并决定是否重试。",
  skillsCenter: "管理测试生成技能模板与版本。项目绑定已发布的技能版本后用于生成。",
  settings: "查看系统与环境配置。只读项与可编辑项以视觉区分。",
  automationSchedules: "查看自动化计划与最近运行状态。",
} as const;

export type PageDescriptionKey = keyof typeof pageDescriptions;

export const fieldHelp = {
  modeGenerate:
    "基于已选文档与 Skill 配置，由 AI 自动生成测试用例草稿。",
  modeImport: "上传已有 JSON 用例文件，跳过 AI 生成直接进入编辑。",
  documentType:
    "PRD 侧重业务场景；Swagger 侧重接口契约；Figma 侧重界面与交互。",
  module: "用于组织用例目录与筛选；建议与 PRD 模块结构一致。",
  feature: "功能点描述用例覆盖的具体能力，便于检索与评审。",
  priority: "P0 为核心路径；P1 为重要分支；P2 为低频或边缘场景。",
  locatorHint: "供 UI 自动化参考的选择器或页面位置描述，非必填。",
  approve: "内容通过评审，可进入发布；不等于已对下游生效。",
  publish: "用例对下游自动化可用；发布后核心内容默认锁定。",
  requestChanges: "需补充或修正后再提交；状态变为待修改。",
  reject: "当前版本不予通过，不进入发布。",
  evidencePolicy:
    "仅依据明确需求/契约/界面证据生成；歧义标待确认，禁止臆造。",
  scenarioTaxonomy: "定义生成用例覆盖的场景类型，如主流程、边界、异常。",
  taskStatus: "排队中、生成中、成功、失败；失败可查看原因并重试。",
  linkedDocuments: "本次生成所依据的资料；与用例追溯链关联。",
} as const;

export type FieldHelpKey = keyof typeof fieldHelp;

export type DeleteBlockReason =
  | "published_test_case"
  | "directory_not_empty"
  | "skill_in_use"
  | "skill_production_version";

export function deleteConfirmMessage(
  kind: "test_case" | "document" | "project_archive" | "skill" | "batch",
  params: { name?: string; title?: string; count?: number },
): { title: string; description: string; confirmLabel: string } {
  switch (kind) {
    case "test_case":
      return {
        title: "确认删除用例？",
        description: `确认删除用例「${params.title ?? ""}」吗？删除后不可恢复。`,
        confirmLabel: "确认删除",
      };
    case "document":
      return {
        title: "确认删除文档？",
        description: `确认删除文档「${params.name ?? ""}」吗？删除后将影响关联生成任务追溯。`,
        confirmLabel: "确认删除",
      };
    case "project_archive":
      return {
        title: "确认归档项目？",
        description: `确认归档项目「${params.name ?? ""}」吗？归档后默认从进行中列表隐藏。`,
        confirmLabel: "确认归档",
      };
    case "skill":
      return {
        title: "确认删除技能？",
        description: `确认删除技能「${params.name ?? ""}」吗？`,
        confirmLabel: "确认删除",
      };
    case "batch":
      return {
        title: "确认删除？",
        description: `确认删除选中的 ${params.count ?? 0} 条记录吗？`,
        confirmLabel: "确认删除",
      };
  }
}

export function deleteBlockMessage(reason: DeleteBlockReason): string {
  switch (reason) {
    case "published_test_case":
      return "该用例已发布，请先退回草稿后再删除。";
    case "directory_not_empty":
      return "目录下存在子目录或用例，不可删除。";
    case "skill_in_use":
      return "该技能仍被使用，请先解除绑定后再删除。";
    case "skill_production_version":
      return "生产版本不可删除，请发布新版本或执行回滚。";
  }
}

export const workflowStepLabels = [
  { key: "project", label: "新建项目" },
  { key: "upload", label: "上传资料" },
  { key: "generate", label: "生成用例" },
  { key: "edit", label: "编辑补充" },
  { key: "review", label: "评审" },
  { key: "publish", label: "发布" },
] as const;
