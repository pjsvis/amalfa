import os
from typing import Optional
from .base import LanguageModelProvider


def create_provider(provider_name: Optional[str] = None) -> LanguageModelProvider:
    if provider_name is None:
        provider_name = os.environ.get("LANGEXTRACT_PROVIDER", "gemini")
    
    provider_name = provider_name.lower()
    
    if provider_name == "gemini":
        from .gemini import GeminiLanguageModelProvider
        return GeminiLanguageModelProvider()
    elif provider_name == "ollama":
        from .ollama import OllamaLanguageModelProvider
        return OllamaLanguageModelProvider()
    else:
        raise ValueError(f"Unknown provider: {provider_name}. Supported: gemini, ollama")


__all__ = ["LanguageModelProvider", "create_provider"]
