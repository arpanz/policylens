"""Factory for LLM backends."""

from __future__ import annotations

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from .base_llm import BaseLLM

logger = get_logger(__name__)


def get_llm(provider: str | None = None) -> BaseLLM:
    """Instantiate an LLM by *provider* name.

    Falls back to ``settings.llm_provider`` (default ``"kimi"``).
    """
    provider = (provider or settings.llm_provider).lower().strip()

    if provider == "kimi":
        from .kimi_llm import KimiLLM

        llm = KimiLLM()

    elif provider == "openai":
        from openai import OpenAI as _OpenAI

        from .kimi_llm import KimiLLM

        llm = KimiLLM(model="gpt-4o")
        # Swap to native OpenAI endpoint
        llm._client = _OpenAI(api_key=settings.openai_api_key)
        logger.info("OpenAI client override applied for provider='openai'")

    else:
        logger.warning(
            "Unknown llm_provider '%s' — falling back to Kimi", provider
        )
        from .kimi_llm import KimiLLM

        llm = KimiLLM()

    logger.info("LLM instantiated: %s (provider=%s)", type(llm).__name__, provider)
    return llm
