from __future__ import annotations

from dataclasses import dataclass

from app.modules.provider.base import ProviderGenerationRequest, ProviderGenerationResponse


@dataclass(slots=True)
class CursorProvider:
    default_model = "cursor-default"

    model: str = default_model
    prompt_version: str = "default"
    name: str = "cursor"

    def generate_test_cases(
        self,
        request: ProviderGenerationRequest,
    ) -> ProviderGenerationResponse:
        raise NotImplementedError(
            "Cursor provider invocation is not wired yet for "
            f"prompt profile '{request.prompt_version}'."
        )
