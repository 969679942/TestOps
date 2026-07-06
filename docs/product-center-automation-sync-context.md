# 商品中心自动化用例同步上下文

> **生成日期**：2026-06-18  
> **工作区**：`D:\Menusifu\AIQA`  
> **用途**：记录规范修订、skill/生成器同步、坎昆文档整改、PRD 目录提取的完整上下文，供 TestOps / 后续 Agent 接续。

---

## 1. 背景与目标

围绕**商品中心自动化用例**做「规范 ↔ skill ↔ 生成器 ↔ 文档」同源同步，消除：

- UI / API / E2E 边界不清
- 12 字段全必填 vs 依赖型必填
- 多场景未拆分（一格一执行单元）
- 起始页面与测试步骤第 1 步不一致
- 断言模糊（`以现网为准`、`A 或 B 任一成立`、预期中 `展示正确` 等）

---

## 2. 规范文档（团队可读版）

**路径**：`D:\Menusifu\AIQA\商品中心PRD\AIQA文档\商品中心自动化用例编写规范.md`

### 2.1 已落实修订

| 优先级 | 内容 |
|--------|------|
| **P0** | §3 执行分层（Markdown 仅 UI/E2E）；§5.1/5.2 全量 + 依赖型必填；§6 一格一执行单元；§7 起始页面门禁 |
| **P1** | §2 组模块 → `suite-conventions-grp.md`；§10.2 标题 vs 预期；§11 E2E 专节；§8.3 组命名；§4 套件约定写一次 |
| **P2** | §14 检查清单；§16 引用 skill / 脚本路径 |

### 2.2 §14 工具校验表述

- **`validate_output`**：`formal-to-automation.py` **内置校验**，非独立 CLI
- **独立命令**：
  - `fix-entry-gate.py --check` — §7 起始页面与步骤第 1 步一致
  - `fix-vague-steps.py --check` — §9.2 模糊步骤

---

## 3. Skill / 生成器同步（已完成）

### 3.1 Skill

**路径**：`.cursor/skills/product-center-automation-test-case/SKILL.md`

| 项 | 内容 |
|----|------|
| 铁律 §4 | 商品 → `suite-conventions.md`；组 → `suite-conventions-grp.md` |
| 多场景拆分 | 补组模块：`-A` 组名空 / `-B` 明细名空 |
| 预期写法 | §10.3 禁止项；交付检查与 `validate_output` 表述 |

### 3.2 生成器脚本

| 文件 | 改动 |
|------|------|
| `scripts/formal-to-automation.py` | 断言去「以现网为准」「或…」；扩展 `validate_output` 扫 §10.3 |
| `scripts/group_enhance.py` | 组 `-A/-B` 断言与规范对齐 |
| `examples.md` | 样例断言同步 |

### 3.3 新断言模板（生成器输出）

```
「{field}」字段出现必填校验提示。
套餐组区域出现必选提示。
列表按 `{name}` 查询，无本次新建记录。
商品名称字段出现重复名称校验提示。
页面提示包含 `SYSTEM-0002:参数冲突`。
```

### 3.4 `validate_output` 扫描范围

- 模糊步骤（§9.2）
- §10.3 禁止预期：`以现网为准`、`展示正确`、`功能正常`、`任一成立`
- 「A 或 B」式或断言（预期中含 `，…或…`）
- `-SETUP` / `-TEARDOWN`、`执行类型：API`
- 数据依赖字段完整性（`数据标识` / Readiness / `数据准备`）

---

## 4. 坎昆主交付文档整改（已完成）

### 4.1 文件

- `商品中心PRD/AIQA文档/坎昆商品中心PRD测试方案/商品管理/1.商品中心-商品管理-商品-自动化测试用例.md`
- `商品中心PRD/AIQA文档/坎昆商品中心PRD测试方案/商品管理/2.商品中心-商品管理-组-自动化测试用例.md`

### 4.2 整改范围

- **表 A**：§10.3 硬违规（`以现网为准`、预期 `展示正确` 等）
- **表 B**：「A 或 B」式或断言
- **拆分场景 7 处**：必填项 `-A/-B` 旧「以现网为准」模板

### 4.3 复检结果（2026-06-18）

| 检查项 | 商品 | 组 |
|--------|:----:|:--:|
| `validate_output` | **0** | **0** |
| `fix-entry-gate.py --check` | **0** | — |
| `fix-vague-steps.py --check` | **0** | — |
| 全文「以现网为准」/ 预期「展示正确」/ `，或` | **0** | **0** |

> 用例**标题**仍可含「展示正确」（§10.2）；**预期**须可观测、具体。

### 4.4 典型改写示例

| 用例 | 改前 | 改后要点 |
|------|------|----------|
| TC-ITEM-STD-005-A | `…以现网为准` | `「商品名称」字段出现必填校验提示` |
| TC-ITEM-PKG-010-C | `必选提示，或页面提示…` | `套餐组区域出现必选提示` |
| TC-ITEM-STD-004 | `页面文本展示正确` | 中英文关键标签可观测 |
| TC-GRP-SPEC-005-B | `无仅含组名…（以现网为准）` | `列表按 \`{name}\` 查询，无本次新建记录` |
| TC-GRP-SPEC-012 等 | `SYSTEM-0002 或等价重复提示` | `页面提示包含 SYSTEM-0002:参数冲突` |

---

## 5. PRD 目录同步（已完成）

### 5.1 脚本

**路径**：`.cursor/skills/product-center-automation-test-case/scripts/extract-prd-automation.py`

**逻辑**：

1. 解析 `PRD与对应测试用例/*-测试用例.md` 中的 `TC-需求N-xxx` 与标题
2. 从坎昆商品/组自动化源按**用例标题**匹配块（`TITLE_ALIASES` 处理拆分场景）
3. 重写用例编号为 `TC-需求N-xxx`（多块 → `-A/-B`）
4. 写入同目录 `*-自动化测试用例.md`

### 5.2 生成统计

| 文件 | 需求用例 | 已匹配 | 自动化块 | 未匹配 |
|------|---------|--------|---------|--------|
| 1.需求品牌商品与分类 | 150 | 148 | 151 | 2 |
| 2.需求规格组 | 39 | 37 | 38 | 2 |
| 3.需求口味组 | 27 | 27 | 28 | 0 |
| 4.需求做法组 | 23 | 23 | 23 | 0 |
| 5.需求套餐组 | 64 | 61 | 61 | 3 |
| 6.需求加料组 | 43 | 39 | 39 | 4 |
| **合计** | **346** | **335** | **340** | **11** |

### 5.3 PRD 自动化文档校验

6 份 `PRD与对应测试用例/*-自动化测试用例.md`：

- 无 `以现网为准` / 预期「展示正确」/ `，或` 模糊断言
- 拆分场景已同步（例：`TC-需求1-031-A` → 商品名必填校验提示）

### 5.4 未匹配 11 条

各文件末尾 **「未匹配自动化源（未写入正文）」** 节有完整表格。原因：坎昆源无同名块且无 `TITLE_ALIASES`。

| 需求 | 用例编号 | 标题摘要 |
|------|----------|----------|
| 1 | TC-需求1-057 | 商品描述超过 500 字符时提交失败 |
| 1 | TC-需求1-102 | 套餐商品商品描述超过 500 字符时保存失败或截断 |
| 2 | TC-需求2-031 | 多规格商品选择默认规格创建成功并展示默认规格价格 |
| 2 | TC-需求2-032 | 多规格商品未选默认规格时列表展示最低规格价格 |
| 5 | TC-需求5-062 | 组合搭配单次加价为 0 元时保存正确 |
| 5 | TC-需求5-063 | 套餐商品在编辑页组合搭配单次加价仅对商品生效 |
| 5 | TC-需求5-064 | 套餐商品引用组合搭配默认选中唯一项 |
| 6 | TC-需求6-040 | 加料组最少可选与最多可选同时为 0 保存失败 |
| 6 | TC-需求6-041 | 加料组最少大于最多或超过子项数保存失败 |
| 6 | TC-需求6-042 | 加料组单次加价为 0 元时保存正确 |
| 6 | TC-需求6-043 | 组编辑后单次加价不同步到已引用商品 |

**处理**：先在坎昆源生成对应自动化块，或在 `extract-prd-automation.py` 的 `TITLE_ALIASES` 补映射后重跑。

---

## 6. 常用命令

```bash
# 工作区根目录：D:\Menusifu\AIQA

# 正式 → 坎昆自动化
python .cursor/skills/product-center-automation-test-case/scripts/formal-to-automation.py

# 坎昆 → PRD 需求自动化
python .cursor/skills/product-center-automation-test-case/scripts/extract-prd-automation.py

# §7 起始页面门禁（当前仅 TC-ITEM-*）
python .cursor/skills/product-center-automation-test-case/scripts/fix-entry-gate.py --check --path "商品中心PRD/AIQA文档/坎昆商品中心PRD测试方案/商品管理/1.商品中心-商品管理-商品-自动化测试用例.md"

# §9.2 模糊步骤
python .cursor/skills/product-center-automation-test-case/scripts/fix-vague-steps.py --check --path "商品中心PRD/AIQA文档/坎昆商品中心PRD测试方案/商品管理/1.商品中心-商品管理-商品-自动化测试用例.md"
```

---

## 7. 关键文件索引

| 用途 | 路径（相对 AIQA 根） |
|------|----------------------|
| 团队规范 | `商品中心PRD/AIQA文档/商品中心自动化用例编写规范.md` |
| Skill | `.cursor/skills/product-center-automation-test-case/SKILL.md` |
| 商品套件约定 | `.cursor/skills/product-center-automation-test-case/suite-conventions.md` |
| 组套件约定 | `.cursor/skills/product-center-automation-test-case/suite-conventions-grp.md` |
| 正式→自动化 | `.cursor/skills/product-center-automation-test-case/scripts/formal-to-automation.py` |
| PRD 提取 | `.cursor/skills/product-center-automation-test-case/scripts/extract-prd-automation.py` |
| 入口门禁 | `.cursor/skills/product-center-automation-test-case/scripts/fix-entry-gate.py` |
| 模糊步骤 | `.cursor/skills/product-center-automation-test-case/scripts/fix-vague-steps.py` |
| 坎昆商品自动化 | `商品中心PRD/AIQA文档/坎昆商品中心PRD测试方案/商品管理/1.商品中心-商品管理-商品-自动化测试用例.md` |
| 坎昆组自动化 | `商品中心PRD/AIQA文档/坎昆商品中心PRD测试方案/商品管理/2.商品中心-商品管理-组-自动化测试用例.md` |
| PRD 需求自动化 | `商品中心PRD/AIQA文档/PRD与对应测试用例/1~6.*-自动化测试用例.md` |

---

## 8. 待办（可选后续）

1. 坎昆源补全 **11 条未匹配** 自动化块 → 重跑 `extract-prd-automation.py`
2. 扩展 `fix-entry-gate.py` 支持 **TC-GRP-*** 组用例 §7 扫描
3. 坎昆商品文档步骤细化（如 TC-ITEM-PKG-013：`商品名称填写测试值` → 具名反引号）
4. 按 §7 对坎昆全量自动化文档做入口批量扫描（商品侧已通过）

---

## 9. 文档分工关系

```
商品中心自动化用例编写规范.md  ←→  SKILL.md（同源）
         │
         ▼
formal-to-automation.py  ←  正式测试用例.md
         │
         ▼
坎昆 *-自动化测试用例.md（主交付）
         │
         ▼
extract-prd-automation.py  ←  PRD *-测试用例.md（按标题）
         │
         ▼
PRD与对应测试用例/*-自动化测试用例.md
```

- **正式用例**：保留 `所属模块`、`来源`、BR 追溯
- **自动化 Markdown**：仅 UI/E2E 可执行步骤 + 可观测断言；API 造数/清理归执行计划
