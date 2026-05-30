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
        document_ids = []
        input_refs = request.input_refs
        if isinstance(input_refs, dict):
            raw_ids = input_refs.get("document_ids", [])
            if isinstance(raw_ids, list):
                document_ids = [item for item in raw_ids if isinstance(item, int)]

        source_hint = (
            f"文档 {', '.join(str(item) for item in document_ids)}"
            if document_ids
            else "已上传资料"
        )

        payload: dict[str, Any] = {
            "cases": [
                {
                    "title": "使用有效支付方式完成结账",
                    "steps": [
                        {"text": "打开购物车不为空的结账页"},
                        {"text": "输入有效银行卡信息并提交支付"},
                    ],
                    "expected_results": [
                        {"text": "展示购物车摘要与支付表单"},
                        {"text": "进入订单确认页并显示订单号"},
                    ],
                },
                {
                    "title": "过期银行卡提交时展示校验错误",
                    "steps": [
                        {"text": "在结账页输入已过期的银行卡"},
                        {"text": "点击提交支付"},
                    ],
                    "expected_results": [
                        {"text": "有效期字段展示校验提示"},
                        {"text": "支付未提交，用户仍停留在结账页"},
                    ],
                },
                {
                    "title": "在后台对已结算订单发起退款",
                    "steps": [
                        {"text": "在支付后台找到已结算订单"},
                        {"text": "触发全额退款"},
                    ],
                    "expected_results": [
                        {"text": "订单状态变为退款处理中"},
                        {"text": f"退款操作可追溯到 {source_hint}"},
                    ],
                },
            ]
        }

        return ProviderGenerationResponse(
            provider=self.name,
            model=self.model,
            payload=payload,
            metadata={"prompt_version": self.prompt_version},
        )
