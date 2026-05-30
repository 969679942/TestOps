# Design

## Theme

Light product UI. 侧栏 + 主内容区双栏布局，Restrained 配色，蓝色 accent 仅用于主操作与当前导航。

## Color

| Token | Value | Usage |
|-------|-------|--------|
| `--page-bg` | `#f1f5f9` | 页面背景 |
| `--panel-bg` | `#ffffff` | 卡片、侧栏 |
| `--panel-muted` | `#f8fafc` | 次要表面、hover |
| `--sidebar-bg` | `#fafbfc` | 侧栏背景 |
| `--text` | `#0f172a` | 正文、标题 |
| `--muted` | `#475569` | 辅助文案（≥4.5:1 on white） |
| `--accent` | `#2563eb` | 主操作、当前项 |
| `--border` | `#e2e8f0` | 分隔线 |

## Typography

- 栈：`Segoe UI`, `PingFang SC`, `Microsoft YaHei`, sans-serif
- 正文 14px / 1.5
- 标题 scale：1.75rem 页标题 → 1.05rem 卡片标题 → 12px 标签

## Spacing

4px 基准：`--space-1` 4px … `--space-6` 24px。组件 gap 优先用 token。

## Motion

150–200ms，`ease-out` 仅用于状态反馈。无页面级入场序列、无 spring/bounce。

## Components

- 主按钮 `.button-primary`、次按钮 `.button-secondary`、幽灵 `.button-ghost`、危险 `.button-danger`
- 分段 Tab `.tab-button` + `.is-active`（支持方向键切换）
- 状态徽章 `.status-badge`
- 表单 `.field` + input/select/textarea
- 流程条 `.workflow-steps`（含生成中 `generating` 态）
- 文档行 `.document-row` + `.document-row-main`（勾选 + 删除）
- 导入预览 `.import-preview-list`
- 全局加载/错误 `.loading-page`、`.error-page`
- 模态框 `.modal-backdrop` + focus trap / Esc 关闭
