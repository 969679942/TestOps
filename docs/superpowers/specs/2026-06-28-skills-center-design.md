# Skills Center 统一技能中心设计

## 背景

当前 TestOps 已支持项目级 `Skill Package`、版本管理和激活配置，能够驱动“文档上传 -> Skills 配置 -> 生成测试用例”的主链路。但从平台成熟度来看，现有实现仍然停留在“每个项目内单独维护一套技能”的阶段，存在以下问题：

- Skills 只能在项目内查看和维护，没有统一的全局资产中心
- 通用模板仍然写死在代码中，不支持产品化管理、发布、下线和评测
- 项目之间无法复用同一套成熟技能，只能重复创建相似配置
- 生成任务直接依赖项目当前激活版本，不具备清晰的组织级治理视角
- 缺少“发布版本 / 实验版本 / 废弃版本”的完整状态机
- 缺少技能版本效果评测，无法判断某版技能是否真的提升用例质量
- 缺少分层规则，不区分组织级规范、项目级补充规则、生成时临时补充说明

从成熟产品的共性做法来看，规则、Prompt、模板这类能力不应该只存在于项目页面中，而应当具备统一管理、版本控制、发布和回溯能力：

- Cursor 将规则分为 Project / Team / User Rules，而不是把所有规则塞进单一项目上下文中
- GitHub Models 将 Prompt 视为可存储、可比较、可评估的资产
- Langfuse 提供统一 Prompt Management，支持版本、标签、目录和实验

这说明 TestOps 中的 Skills 不应该只是“项目字段”，而应该升级为“测试生成能力资产”。

## 目标

本次改造的目标是：

1. 将当前项目内 Skills 升级为“统一技能中心 + 项目绑定”的模式。
2. 建立全局 `Skills Center`，集中管理通用测试生成技能。
3. 支持组织级共享技能、项目级绑定技能、生成任务级快照三层结构。
4. 让生成任务只使用明确发布的技能版本，保证可追溯、可复现、可回滚。
5. 为后续效果评估、Prompt 实验、技能模板沉淀提供标准化数据基础。

## 非目标

本次不包含以下内容：

- 不在本次中实现复杂的多租户 SaaS 组织体系
- 不在本次中引入完整的 RBAC 权限平台
- 不在本次中接入外部 Prompt 管理平台
- 不在本次中实现自动化的 AI 评委模型体系
- 不在本次中推翻已有项目级 Skill Package 数据，而是保留兼容迁移路径

## 设计原则

### 1. 全局复用优先

通用测试生成技能应优先在全局沉淀和发布，再由项目绑定使用，而不是在每个项目中重复创建。

### 2. 项目只做绑定和覆盖

项目页中的 Skills 不再是主资产库，而是“当前项目使用哪套技能、是否有项目级补充约束”的配置入口。

### 3. 发布版本驱动生成

生成任务必须依赖明确的技能版本快照，而不是依赖“当前页面上看起来激活的最新配置”。

### 4. 可追溯、可比较、可回滚

每次生成必须能够回答三个问题：

- 用了哪份文档版本
- 用了哪套技能版本
- 用了哪些项目级和任务级补充约束

### 5. 中文工作流优先

技能命名、分类、状态、发布语义和评测指标应优先适配中文测试团队的工作方式。

## 总体架构

Skills 体系调整为三层：

### 一、Global Skill Library

组织级共享技能资产库，用于沉淀通用测试生成能力。

包含：

- 技能定义
- 技能版本
- 技能分类
- 标签
- 发布状态
- 评测记录
- 发布说明

### 二、Project Skill Binding

项目级绑定层，用于声明当前项目使用哪套全局技能，以及附加哪些项目级规则覆盖。

包含：

- 绑定哪个全局技能
- 绑定哪个发布版本
- 是否设为当前项目默认
- 项目级 override
- 生效范围

### 三、Generation Snapshot

生成任务快照层，记录一次任务实际使用的技能版本、绑定关系、文档版本和附加说明。

包含：

- 技能版本快照
- 项目级 override 快照
- 任务级 gap note / 补充说明
- 当次输入文档版本

## 信息架构

### 一、全局 Skills Center

新增一级导航：

- `Skills Center`

建议页面结构：

1. `共享技能库`
2. `模板与分类`
3. `版本发布`
4. `效果评测`
5. `变更记录`

#### 1. 共享技能库页

展示所有全局技能，支持：

- 按领域筛选：电商、支付、账户、后台、工作流、API、补场景
- 按文档类型筛选：PRD、业务规则、OpenAPI、Figma、补充资料
- 按状态筛选：草稿、已评审、已发布、已废弃
- 按标签筛选：主流程、边界、异常、权限、状态流转、回滚恢复
- 搜索技能名、系统关键字、适用场景

列表字段建议：

- 技能名称
- Skill Key
- 分类
- 适用输入类型
- 当前生产版本
- 最近评测结果
- 状态
- 最后更新时间

#### 2. 技能详情页

技能详情页展示：

- 基本信息
- 适用范围
- 版本时间线
- 当前生产版本
- 当前实验版本
- Prompt / Taxonomy / Checklist / Coverage Dimensions
- 版本对比
- 被哪些项目绑定
- 最近生成效果

#### 3. 版本发布页

聚焦版本管理和发布动作：

- 新建版本
- 从历史版本复制
- 基于模板初始化
- 标记为已评审
- 发布为 production
- 下线 / 废弃
- 回滚到上一稳定版本

#### 4. 效果评测页

统一比较不同技能版本的效果，支持：

- 选择评测样本集
- 选择候选技能版本
- 查看覆盖率、重复率、可追溯性、结构完整度
- 比较多个版本的结果差异

### 二、项目内 Skills 页

项目页中的 `/projects/[projectId]/skills` 改造成“项目技能绑定页”，不再承担全局技能资产维护职责。

页面信息架构建议：

1. 当前项目默认技能
2. 已绑定技能列表
3. 项目级补充规则
4. 最近生成效果反馈
5. 技能版本升级建议

#### 当前项目默认技能

展示：

- 当前默认技能名称
- 当前绑定的发布版本
- 上次切换时间
- 生效范围

动作：

- 切换默认技能
- 升级到新版
- 回滚到旧版

#### 已绑定技能列表

一个项目可以绑定多套技能，例如：

- `PRD + 业务规则主模板`
- `API 合同回归模板`
- `补场景模板`

生成时可根据任务类型选择：

- 主生成技能
- 补场景技能
- API 专项技能

#### 项目级补充规则

项目级 override 不再直接改全局技能内容，而是只管理项目特有配置，例如：

- 项目边界，不覆盖哪些模块
- 项目高风险重点
- 必须覆盖的核心流程
- 禁止生成的范围
- 术语映射

### 三、生成任务页

生成页中的技能区应升级为：

- 选择已绑定技能
- 显示绑定版本
- 允许选择稳定版或候选版
- 显示该技能的适用范围和最近效果摘要

不再只显示“Active Skill Versions”，而要明确：

- 技能名称
- 来源：全局技能库 / 项目专属
- 版本号
- 发布状态
- 适用文档类型
- 最近评测结果

## 数据模型设计

### 一、全局技能实体

新增 `global_skill_definitions`

建议字段：

- `id`
- `skill_key`
- `name`
- `description`
- `category`
- `domain`
- `input_types`
- `status`
- `owner`
- `created_at`
- `updated_at`

说明：

- `skill_key` 全局唯一
- `status` 表示技能定义整体状态，不等同于版本状态

### 二、全局技能版本实体

新增 `global_skill_versions`

建议字段：

- `id`
- `global_skill_id`
- `version_no`
- `version_label`
- `status`
- `prompt_template`
- `scenario_taxonomy`
- `review_checklist`
- `coverage_dimensions`
- `evidence_policy`
- `storage_uri`
- `change_log`
- `release_notes`
- `created_by`
- `created_at`
- `published_at`

建议版本状态：

- `draft`
- `reviewed`
- `staging`
- `production`
- `deprecated`

### 三、项目技能绑定实体

新增 `project_skill_bindings`

建议字段：

- `id`
- `project_id`
- `global_skill_id`
- `bound_version_id`
- `binding_type`
- `is_default`
- `override_payload`
- `created_at`
- `updated_at`

说明：

- `binding_type` 可区分：主生成、API 专项、补场景专项
- `override_payload` 只保存项目级差异，不复制全量技能内容

### 四、生成技能快照实体

建议为生成任务新增：

- `input_skill_binding_id`
- `input_global_skill_id`
- `input_global_skill_version_id`
- `input_skill_snapshot`

其中 `input_skill_snapshot` 保存当次完整快照：

- prompt_template
- taxonomy
- checklist
- coverage dimensions
- evidence policy
- project override
- task gap note

这样即使后续技能升级，也不影响历史任务复现。

### 五、技能评测实体

新增 `skill_evaluations`

建议字段：

- `id`
- `global_skill_version_id`
- `dataset_name`
- `project_scope`
- `run_status`
- `coverage_score`
- `duplication_score`
- `traceability_score`
- `review_pass_rate`
- `summary`
- `created_at`

## API 设计

### 一、全局技能中心 API

建议新增：

- `GET /skills/library`
- `POST /skills/library`
- `GET /skills/library/{skillId}`
- `PATCH /skills/library/{skillId}`
- `GET /skills/library/{skillId}/versions`
- `POST /skills/library/{skillId}/versions`
- `POST /skills/library/{skillId}/versions/{versionId}/review`
- `POST /skills/library/{skillId}/versions/{versionId}/publish`
- `POST /skills/library/{skillId}/versions/{versionId}/deprecate`

### 二、项目绑定 API

建议新增：

- `GET /projects/{projectId}/skill-bindings`
- `POST /projects/{projectId}/skill-bindings`
- `PATCH /projects/{projectId}/skill-bindings/{bindingId}`
- `POST /projects/{projectId}/skill-bindings/{bindingId}/set-default`
- `POST /projects/{projectId}/skill-bindings/{bindingId}/switch-version`

### 三、评测 API

建议新增：

- `POST /skills/library/{skillId}/versions/{versionId}/evaluate`
- `GET /skills/evaluations`
- `GET /skills/evaluations/{evaluationId}`

### 四、兼容旧接口策略

当前项目级接口：

- `/projects/{project_id}/skill-packages`
- `/skill-packages/{skill_package_id}/versions`

第一阶段不直接删除，改为兼容层：

- 项目页继续能读旧数据
- 新 UI 优先写新模型
- 数据迁移完成后，旧接口逐步降级为只读或内部桥接

## 权限设计

第一版建议简单分为三类角色：

### 1. 技能管理员

可以：

- 创建全局技能
- 创建技能版本
- 标记评审通过
- 发布 / 下线

### 2. 项目管理员

可以：

- 绑定全局技能到项目
- 配置项目级 override
- 切换项目默认技能

### 3. 普通测试成员

可以：

- 查看可用技能
- 在生成任务中选择已绑定技能
- 提交技能效果反馈

## 交互规则

### 一、全局技能版本发布规则

1. 草稿版本不可直接作为项目默认技能
2. 只有 `reviewed / staging / production` 版本可被项目绑定
3. 生产环境默认只允许选择 `production`
4. 项目若绑定了已废弃版本，系统应提示升级

### 二、项目绑定规则

1. 一个项目必须存在且仅存在一个主默认技能
2. 一个项目可以绑定多个专项技能
3. 项目 override 不允许覆盖技能的基础结构字段，只允许追加或限制
4. 切换默认技能后，不影响历史任务，只影响新任务

### 三、生成任务规则

1. 创建任务时必须记录技能版本快照
2. 历史任务回看时显示快照，而不是当前最新技能
3. 补场景生成允许选择“主技能 + 补场景技能 + 种子用例”

## 页面改造清单

### 一、新增页面

建议新增：

- `/skills`
- `/skills/[skillId]`
- `/skills/[skillId]/versions/[versionId]`
- `/skills/evaluations`

### 二、调整页面

需要调整：

- `/projects/[projectId]/skills`
- `/projects/[projectId]/generation-tasks`
- `/projects/[projectId]/documents`
- 首页项目卡片中的 Skills 快捷入口文案

### 三、导航调整

建议全局导航增加：

- `Skills Center`

项目导航中的 `Skills` 改名为：

- `项目技能`

避免用户误解为这里就是全局技能中心。

## 迁移策略

### 第一阶段：引入新模型，不破旧流程

- 保留现有 `skill_packages` 和 `skill_package_versions`
- 增加全局技能中心相关表
- 新前端页面优先展示全局技能中心
- 项目页保留旧技能展示

### 第二阶段：数据迁移

将当前项目内已有技能按规则迁移：

- 若内容接近通用模板，迁入全局共享技能
- 若明显项目特化，迁为项目专属绑定

迁移原则：

- 不强行合并明显差异化技能
- 保留来源项目和迁移说明

### 第三阶段：项目页切换到绑定模型

- 项目页不再创建“全新技能包”
- 项目页改为绑定全局技能
- 如确需项目专属技能，则必须先在技能中心创建，再绑定

### 第四阶段：旧接口降级

- 旧的项目内 Skill Package 写接口收口
- 保留读取和历史兼容
- 新增生成任务全部走新快照模型

## 分阶段开发顺序

### P0

目标：建立统一技能中心骨架，不影响现有主链路。

- 新增全局技能定义和版本表
- 新增全局 Skills Center 只读页面
- 将现有代码中的模板库抽出为可落库的种子数据
- 项目页增加“来自全局技能库 / 项目级旧技能”的区分标识

### P1

目标：让项目开始绑定全局技能，并让生成任务使用绑定版本。

- 新增项目技能绑定模型和 API
- 项目页 Skills 改造成“绑定页”
- 生成页从“项目激活版本”切到“绑定版本”
- 生成任务写入技能快照

### P2

目标：补齐治理和质量闭环。

- 增加版本发布状态机
- 增加技能评测页
- 增加版本对比和效果反馈
- 增加升级建议、废弃提醒和回滚能力

## 验收标准

### 产品侧

- 用户能在全局找到所有通用测试生成技能
- 用户能在项目内绑定全局技能而不是重复造轮子
- 用户能明确区分“技能中心”和“项目技能绑定”
- 用户能看到历史生成使用的具体技能版本

### 技术侧

- 新旧接口兼容，主链路不中断
- 历史技能数据可迁移
- 生成任务具备完整技能快照
- 前后端测试覆盖新增模型与主链路

### 治理侧

- 技能存在明确版本状态
- 项目默认技能可切换、可回滚
- 技能效果可评测、可比较

## 推荐的第一批内置共享技能

建议先内置以下共享技能，作为 Skills Center 的首批资产：

1. `prd_rules_core`
   - PRD + 业务规则主模板
2. `api_contract_regression`
   - OpenAPI / Swagger 合同与回归模板
3. `workflow_recovery`
   - 跨系统流程与补场景模板
4. `account_auth_matrix`
   - 账号登录、注册、鉴权、权限矩阵模板
5. `payment_transaction_flow`
   - 支付、退款、风控、对账模板
6. `admin_approval_audit`
   - 后台审批、状态流转、审计模板

## 参考方案

- Cursor Rules: https://cursor.com/docs/rules
- GitHub Models: https://docs.github.com/en/github-models/about-github-models
- GitHub Models Prompt Optimization: https://docs.github.com/en/github-models/use-github-models/optimizing-your-ai-powered-app-with-github-models
- GitHub Models Evaluation: https://docs.github.com/en/github-models/use-github-models/evaluating-ai-models
- Langfuse Prompt Management Overview: https://langfuse.com/docs/prompt-management/overview
- Langfuse Prompt Version Control: https://langfuse.com/docs/prompt-management/features/prompt-version-control
- Langfuse Prompt Folders: https://langfuse.com/docs/prompt-management/features/folders
- Langfuse Prompt A/B Testing: https://langfuse.com/docs/prompt-management/features/a-b-testing

