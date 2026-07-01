from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.modules.provider.base import ProviderGenerationRequest, ProviderGenerationResponse


@dataclass(slots=True)
class MockProvider:
    default_model = "mock-v1"

    model: str = default_model
    prompt_version: str = "default"
    name: str = "mock"

    def generate_test_cases(
        self,
        request: ProviderGenerationRequest,
    ) -> ProviderGenerationResponse:
        document_version_ids = []
        skill_version_id: int | None = None
        global_skill_version_id: int | None = None
        skill_binding_id: int | None = None
        input_refs = request.input_refs
        if isinstance(input_refs, dict):
            raw_ids = input_refs.get("document_version_ids", [])
            if isinstance(raw_ids, list):
                document_version_ids = [item for item in raw_ids if isinstance(item, int)]
            raw_skill_version_id = input_refs.get("skill_version_id")
            if isinstance(raw_skill_version_id, int):
                skill_version_id = raw_skill_version_id
            raw_global_skill_version_id = input_refs.get("global_skill_version_id")
            if isinstance(raw_global_skill_version_id, int):
                global_skill_version_id = raw_global_skill_version_id
            raw_skill_binding_id = input_refs.get("skill_binding_id")
            if isinstance(raw_skill_binding_id, int):
                skill_binding_id = raw_skill_binding_id

        source_hint = (
            f"文档版本 {', '.join(str(item) for item in document_version_ids)}"
            if document_version_ids
            else "已上传资料"
        )
        taxonomy = []
        seed_test_case_ids: list[int] = []
        coverage_gap_note: str | None = None
        if isinstance(request.context_bundle, dict):
            skill_package = request.context_bundle.get("skill_package", {})
            if isinstance(skill_package, dict):
                raw_taxonomy = skill_package.get("scenario_taxonomy", [])
                if isinstance(raw_taxonomy, list):
                    taxonomy = [str(item) for item in raw_taxonomy]
        if isinstance(input_refs, dict):
            raw_seed_test_case_ids = input_refs.get("seed_test_case_ids", [])
            if isinstance(raw_seed_test_case_ids, list):
                seed_test_case_ids = [item for item in raw_seed_test_case_ids if isinstance(item, int)]
            raw_coverage_gap_note = input_refs.get("coverage_gap_note")
            if isinstance(raw_coverage_gap_note, str) and raw_coverage_gap_note.strip():
                coverage_gap_note = raw_coverage_gap_note.strip()

        payload: dict[str, Any] = {
            "cases": [
                {
                    "title": "使用有效支付方式完成结账",
                    "module": "Checkout",
                    "feature": "Card payment",
                    "case_type": "functional",
                    "priority": "high",
                    "linked_requirement": "Acceptance Criteria: 用户可以使用有效支付方式完成结账",
                    "preconditions": ["购物车中存在可结算商品"],
                    "steps": [
                        {"text": "打开购物车不为空的结账页"},
                        {"text": "输入有效银行卡信息并提交支付"},
                    ],
                    "expected_results": [
                        {"text": "展示购物车摘要与支付表单"},
                        {"text": "进入订单确认页并显示订单号"},
                    ],
                    "tags": ["ai-generated", "happy_path"],
                    "source_refs": [
                        {
                            "source_kind": "document_version",
                            "document_version_ids": document_version_ids,
                            "document_name": source_hint,
                        },
                        {
                            "source_kind": "skill_version",
                            "skill_version_id": skill_version_id,
                            "global_skill_version_id": global_skill_version_id,
                            "skill_binding_id": skill_binding_id,
                            "scenario_taxonomy": taxonomy,
                        },
                    ],
                },
                {
                    "title": "过期银行卡提交时展示校验错误",
                    "module": "Checkout",
                    "feature": "Card validation",
                    "case_type": "negative",
                    "priority": "medium",
                    "linked_requirement": "Business Rule: 过期银行卡不可提交支付",
                    "preconditions": ["存在已过期的银行卡测试数据"],
                    "steps": [
                        {"text": "在结账页输入已过期的银行卡"},
                        {"text": "点击提交支付"},
                    ],
                    "expected_results": [
                        {"text": "有效期字段展示校验提示"},
                        {"text": "支付未提交，用户仍停留在结账页"},
                    ],
                    "tags": ["ai-generated", "boundary"],
                    "source_refs": [
                        {
                            "source_kind": "document_version",
                            "document_version_ids": document_version_ids,
                            "document_name": source_hint,
                        }
                    ],
                },
                {
                    "title": "在后台对已结算订单发起退款",
                    "module": "Refund",
                    "feature": "Refund processing",
                    "case_type": "functional",
                    "priority": "medium",
                    "linked_requirement": "Business Rule: 已结算订单允许发起退款并保留追踪记录",
                    "preconditions": ["后台存在一笔已结算订单"],
                    "steps": [
                        {"text": "在支付后台找到已结算订单"},
                        {"text": "触发全额退款"},
                    ],
                    "expected_results": [
                        {"text": "订单状态变为退款处理中"},
                        {
                            "text": f"退款操作可追溯到 {source_hint}"
                            + (
                                f"，并遵循 skill 版本 {skill_version_id} 的场景分类 {', '.join(taxonomy)}"
                                if skill_version_id is not None and taxonomy
                                else ""
                            )
                        },
                    ],
                    "tags": ["ai-generated", "refund"],
                    "source_refs": [
                        {
                            "source_kind": "document_version",
                            "document_version_ids": document_version_ids,
                            "document_name": source_hint,
                        },
                        {
                            "source_kind": "skill_version",
                            "skill_version_id": skill_version_id,
                            "global_skill_version_id": global_skill_version_id,
                            "skill_binding_id": skill_binding_id,
                            "scenario_taxonomy": taxonomy,
                        },
                    ],
                },
            ]
        }

        if coverage_gap_note:
            payload["cases"].append(
                {
                    "title": "补充缺失场景覆盖",
                    "module": "Coverage",
                    "feature": "Gap supplement",
                    "case_type": "functional",
                    "priority": "medium",
                    "linked_requirement": coverage_gap_note,
                    "steps": [
                        {"text": "基于当前文档、技能包和已有用例分析缺失场景"},
                        {"text": f"补充生成聚焦：{coverage_gap_note}"},
                    ],
                    "expected_results": [
                        {
                            "text": "新增用例覆盖已识别的缺失场景"
                            + (
                                f"，并参考已有用例 {', '.join(str(item) for item in seed_test_case_ids)}"
                                if seed_test_case_ids
                                else ""
                            )
                        },
                    ],
                    "tags": ["ai-generated", "gap-fill"],
                    "source_refs": [
                        {
                            "source_kind": "coverage_gap_note",
                            "note": coverage_gap_note,
                            "seed_test_case_ids": seed_test_case_ids,
                        }
                    ],
                }
            )

        return ProviderGenerationResponse(
            provider=self.name,
            model=self.model,
            payload=payload,
            metadata={"prompt_version": self.prompt_version},
        )
