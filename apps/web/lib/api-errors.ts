type FastApiValidationError = {
  loc?: unknown[];
  msg?: string;
};

export function parseApiErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (item && typeof item === "object" && "msg" in item) {
          const message = (item as FastApiValidationError).msg;
          return typeof message === "string" ? message.trim() : "";
        }
        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return undefined;
}

export function mapProjectCreateError(status: number, message?: string) {
  if (status === 409) {
    return "项目名称或项目代号已存在，请换一个名称。";
  }

  if (status === 422) {
    return message ?? "请检查项目名称是否填写完整。";
  }

  if (message) {
    return message;
  }

  return "创建项目失败，请稍后重试。";
}

export function mapApiUnavailableMessage() {
  return "无法连接后端 API，请确认服务已启动（端口 8000）。";
}

const KNOWN_API_MESSAGES: Record<string, string> = {
  "Project not found": "项目不存在或已被删除。",
  "Archive the project before deleting it": "请先归档项目，再执行删除。",
  "Project with this name or code already exists": "项目名称或项目代号已存在，请换一个名称。",
  "Project is archived. Restore it before making changes.": "项目已归档，请先恢复后再继续操作。",
};

export function translateKnownApiMessage(message?: string) {
  if (!message) {
    return undefined;
  }

  return KNOWN_API_MESSAGES[message] ?? message;
}

export function mapProjectStatusUpdateError(
  status: number,
  message?: string,
  nextStatus?: "active" | "archived",
) {
  const translated = translateKnownApiMessage(message);

  if (status === 404) {
    return "项目不存在或已被删除。";
  }

  if (status === 409) {
    return translated ?? "项目状态冲突，请刷新页面后重试。";
  }

  if (status === 422) {
    return translated ?? "项目状态无效，请刷新页面后重试。";
  }

  if (status >= 500) {
    return "项目状态更新失败，数据库结构可能未更新，请联系管理员执行迁移后重试。";
  }

  if (translated) {
    return translated;
  }

  return nextStatus === "archived" ? "归档项目失败，请稍后重试。" : "恢复项目失败，请稍后重试。";
}

export function mapProjectDeleteError(status: number, message?: string) {
  const translated = translateKnownApiMessage(message);

  if (status === 404) {
    return "项目不存在或已被删除。";
  }

  if (status === 409) {
    return translated ?? "请先归档项目，再执行删除。";
  }

  if (status >= 500) {
    return "删除项目失败，数据库结构可能未更新，请联系管理员执行迁移后重试。";
  }

  if (translated) {
    return translated;
  }

  return "删除项目失败，请稍后重试。";
}
