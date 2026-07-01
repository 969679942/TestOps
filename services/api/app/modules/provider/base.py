from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol


@dataclass(slots=True, frozen=True)
class ProviderGenerationRequest:
    project_id: int
    prompt_version: str
    input_refs: Mapping[str, Any] = field(default_factory=dict)
    context_bundle: Mapping[str, Any] = field(default_factory=dict)


@dataclass(slots=True, frozen=True)
class ProviderGenerationResponse:
    payload: dict[str, Any]
    provider: str
    model: str
    metadata: dict[str, Any] = field(default_factory=dict)


class AIProvider(Protocol):
    name: str
    model: str
    prompt_version: str

    def generate_test_cases(
        self,
        request: ProviderGenerationRequest,
    ) -> ProviderGenerationResponse:
        ...


class UnknownProviderError(ValueError):
    pass
