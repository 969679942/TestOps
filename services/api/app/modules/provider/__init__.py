from app.modules.provider.base import (
    AIProvider,
    ProviderGenerationRequest,
    ProviderGenerationResponse,
    UnknownProviderError,
)
from app.modules.provider.cursor_provider import CursorProvider
from app.modules.provider.mock_provider import MockProvider
from app.modules.provider.openai_provider import OpenAIProvider

PROVIDERS = {
    "cursor": CursorProvider,
    "mock": MockProvider,
    "openai": OpenAIProvider,
}


def resolve_provider(
    name: str,
    *,
    model: str | None = None,
    prompt_version: str = "default",
) -> AIProvider:
    normalized = name.strip().lower()
    provider_class = PROVIDERS.get(normalized)
    if provider_class is None:
        raise UnknownProviderError(f"Unsupported provider: {name}")

    resolved_model = model or provider_class.default_model
    return provider_class(model=resolved_model, prompt_version=prompt_version)


__all__ = [
    "AIProvider",
    "CursorProvider",
    "MockProvider",
    "OpenAIProvider",
    "PROVIDERS",
    "ProviderGenerationRequest",
    "ProviderGenerationResponse",
    "UnknownProviderError",
    "resolve_provider",
]
