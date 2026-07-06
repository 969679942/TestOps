from __future__ import annotations

from copy import deepcopy
from typing import Any

DEFAULT_SKILL_TEMPLATE_KEY = "prd_rules_core"

SKILL_TEMPLATE_LIBRARY: dict[str, dict[str, Any]] = {
    "prd_rules_core": {
        "label": "PRD + 业务规则主模板",
        "description": "覆盖主流程、边界、异常、权限、状态流转与规则约束，适合作为大多数业务系统的起始模板。",
        "prompt_template": (
            "基于 PRD、业务规则、补充资料、API 提示和界面提示生成测试用例。"
            "优先输出有证据支撑的用例，先覆盖核心流程，再补充边界、异常、权限、状态流转和恢复场景。"
        ),
        "scenario_taxonomy": [
            "happy_path",
            "boundary",
            "negative",
            "permission",
            "state_transition",
            "data_variation",
            "recovery",
        ],
        "review_checklist": [
            "traceable",
            "rule-backed",
            "observable",
            "single-purpose",
            "automation-ready",
        ],
        "coverage_dimensions": [
            "core_user_journey",
            "input_validation",
            "business_rule_enforcement",
            "permission_scope",
            "state_transition",
            "fallback_and_recovery",
        ],
        "evidence_policy": "仅依据明确需求、规则、契约、界面证据或种子用例缺口推导用例；遇到歧义应标记待确认，禁止臆造。",
    },
    "api_contract_regression": {
        "label": "API 合同与回归模板",
        "description": "聚焦接口契约、字段校验、鉴权、幂等与错误模型，适合 Swagger/OpenAPI 驱动的生成。",
        "prompt_template": (
            "基于 Swagger/OpenAPI 契约及关联业务规则生成 API 测试用例。"
            "重点覆盖必填字段、结构校验、鉴权、幂等、错误码和向后兼容性。"
        ),
        "scenario_taxonomy": [
            "contract",
            "validation",
            "auth",
            "idempotency",
            "error_model",
            "regression",
        ],
        "review_checklist": [
            "contract-cited",
            "response-checkable",
            "negative-covered",
            "api-automation-ready",
        ],
        "coverage_dimensions": [
            "request_schema",
            "response_schema",
            "status_code_matrix",
            "auth_and_permission",
            "idempotency_and_retry",
        ],
        "evidence_policy": "优先使用契约与明确规则作为断言依据；不得臆造接口或字段。",
    },
    "workflow_recovery": {
        "label": "跨系统流程与补场景模板",
        "description": "适合已有主流程用例后补缺，重点补齐回滚、通知、审计、异步一致性与重试恢复。",
        "prompt_template": (
            "围绕跨系统流程补充缺失场景，聚焦回滚、重试、通知、审计、异步一致性和异常恢复，"
            "避免重复改写已覆盖的核心路径。"
        ),
        "scenario_taxonomy": [
            "gap_fill",
            "rollback",
            "notification",
            "audit",
            "async_consistency",
            "retry_recovery",
        ],
        "review_checklist": [
            "gap-linked",
            "side-effect-covered",
            "recovery-observable",
            "seed-aware",
        ],
        "coverage_dimensions": [
            "downstream_side_effects",
            "retry_and_compensation",
            "message_and_notification",
            "audit_and_operability",
        ],
        "evidence_policy": "仅依据缺口说明和已有种子用例补充缺失覆盖；除非证据表明需要变体，否则避免重复已有场景。",
    },
}

GLOBAL_SKILL_LIBRARY_SEEDS: dict[str, dict[str, Any]] = {
    "prd_rules_core": {
        "name": "PRD + 业务规则主模板",
        "description": "从 PRD、业务规则、补充资料、API 提示和界面提示中生成证据可追溯的测试用例，优先覆盖主流程、边界、异常、权限和状态流转。",
        "category": "core",
        "domain": "general",
        "input_types": ["prd", "business_rule", "supplement", "swagger", "figma"],
        "version_label": "v1 生产版",
        "status": "active",
        "owner": "system",
    },
    "api_contract_regression": {
        "name": "API 合同与回归模板",
        "description": "聚焦 Swagger/OpenAPI 契约、字段校验、鉴权、幂等、错误码和兼容性回归场景。",
        "category": "api",
        "domain": "integration",
        "input_types": ["swagger", "business_rule", "supplement"],
        "version_label": "v1 生产版",
        "status": "active",
        "owner": "system",
    },
    "workflow_recovery": {
        "name": "跨系统流程与补场景模板",
        "description": "基于已有主流程用例补齐回滚、通知、审计、异步一致性、异常恢复和补偿路径。",
        "category": "workflow",
        "domain": "cross_system",
        "input_types": ["prd", "business_rule", "supplement", "swagger"],
        "version_label": "v1 生产版",
        "status": "active",
        "owner": "system",
    },
}


def list_skill_templates() -> list[dict[str, str]]:
    return [
        {
            "key": key,
            "label": str(template["label"]),
            "description": str(template["description"]),
        }
        for key, template in SKILL_TEMPLATE_LIBRARY.items()
    ]


def list_global_skill_library_seeds() -> list[dict[str, Any]]:
    seeds: list[dict[str, Any]] = []
    for key, seed in GLOBAL_SKILL_LIBRARY_SEEDS.items():
        template = resolve_skill_template(key)
        seeds.append(
            {
                "skill_key": key,
                "name": seed["name"],
                "description": seed["description"],
                "category": seed["category"],
                "domain": seed["domain"],
                "input_types": list(seed["input_types"]),
                "status": seed["status"],
                "owner": seed["owner"],
                "version_label": seed["version_label"],
                "storage_uri": f"seed://skills/{key}/v1",
                "prompt_template": template["prompt_template"],
                "scenario_taxonomy": list(template["scenario_taxonomy"]),
                "review_checklist": list(template["review_checklist"]),
                "coverage_dimensions": list(template["coverage_dimensions"]),
                "evidence_policy": template["evidence_policy"],
                "change_log": "内置技能模板库的初始种子版本。",
                "release_notes": "为技能中心 P0 库提供只读生产基线。",
                "created_by": "system",
                "template_key": key,
                "template_label": template["label"],
                "template_description": template["description"],
            }
        )
    return seeds


def resolve_skill_template(template_key: str | None) -> dict[str, Any]:
    key = template_key or DEFAULT_SKILL_TEMPLATE_KEY
    template = SKILL_TEMPLATE_LIBRARY.get(key)
    if template is None:
        template = SKILL_TEMPLATE_LIBRARY[DEFAULT_SKILL_TEMPLATE_KEY]
    return deepcopy(template)


def build_skill_metadata(
    *,
    template_key: str | None,
    overrides: dict[str, Any],
) -> dict[str, Any]:
    template = resolve_skill_template(template_key)
    metadata = {
        "template_key": template_key or DEFAULT_SKILL_TEMPLATE_KEY,
        "template_label": template["label"],
        "template_description": template["description"],
        "prompt_template": template["prompt_template"],
        "scenario_taxonomy": list(template["scenario_taxonomy"]),
        "review_checklist": list(template["review_checklist"]),
        "coverage_dimensions": list(template["coverage_dimensions"]),
        "evidence_policy": template["evidence_policy"],
    }

    for key in ("prompt_template", "evidence_policy"):
        value = overrides.get(key)
        if isinstance(value, str) and value.strip():
            metadata[key] = value.strip()

    for key in ("scenario_taxonomy", "review_checklist", "coverage_dimensions"):
        raw_items = overrides.get(key)
        if not isinstance(raw_items, list):
            continue
        merged: list[str] = list(metadata[key])
        for item in raw_items:
            if not isinstance(item, str):
                continue
            normalized = item.strip()
            if normalized and normalized not in merged:
                merged.append(normalized)
        metadata[key] = merged

    for key, value in overrides.items():
        if key in metadata:
            continue
        metadata[key] = value

    return metadata
