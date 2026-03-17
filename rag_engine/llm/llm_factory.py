"""Factory for LLM backends."""

from __future__ import annotations

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from .base_llm import BaseLLM

logger = get_logger(__name__)


def get_llm(provider: str | None = None, max_tokens: int | None = None) -> BaseLLM:
    """Instantiate an LLM by *provider* name.

    Falls back to ``settings.llm_provider`` (default ``"kimi"``).
    Optional max_tokens overrides the default (4096) when provided.
    """
    provider = (provider or settings.llm_provider).lower().strip()

    if provider == "kimi":
        from .kimi_llm import KimiLLM

        llm = KimiLLM(**(({"max_tokens": max_tokens} if max_tokens else {})))

    elif provider == "openai":
        from openai import OpenAI as _OpenAI

        from .kimi_llm import KimiLLM

        llm = KimiLLM(model="gpt-4o", **(({"max_tokens": max_tokens} if max_tokens else {})))
        # Swap to native OpenAI endpoint
        llm._client = _OpenAI(api_key=settings.openai_api_key)
        logger.info("OpenAI client override applied for provider='openai'")

    else:
        logger.warning(
            "Unknown llm_provider '%s' — falling back to Kimi", provider
        )
        from .kimi_llm import KimiLLM

        llm = KimiLLM(**(({"max_tokens": max_tokens} if max_tokens else {})))

    logger.info("LLM instantiated: %s (provider=%s, max_tokens=%s)", type(llm).__name__, provider, max_tokens or "default")
    return llm
