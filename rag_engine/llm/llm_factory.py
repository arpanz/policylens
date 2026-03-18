"""Factory for LLM backends."""

from __future__ import annotations

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from .base_llm import BaseLLM

logger = get_logger(__name__)


def get_llm(
    provider: str | None = None,
    max_tokens: int | None = None,
    model: str | None = None,
) -> BaseLLM:
    """Instantiate an LLM by *provider* name.

    Falls back to ``settings.llm_provider`` (default ``"kimi"``).
    Optional max_tokens overrides the default (4096) when provided.
    Optional model overrides settings.llm_model when provided.
    """
    provider = (provider or settings.llm_provider).lower().strip()

    if provider == "kimi":
        from .kimi_llm import KimiLLM

        kwargs = {}
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        if model:
            kwargs["model"] = model
        llm = KimiLLM(**kwargs)

    elif provider == "openai":
        from openai import OpenAI as _OpenAI
        from .kimi_llm import KimiLLM

        kwargs = {}
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        llm = KimiLLM(model=model or "gpt-4o", **kwargs)
        llm._client = _OpenAI(api_key=settings.openai_api_key)
        logger.info("OpenAI client override applied for provider='openai'")

    else:
        logger.warning(
            "Unknown llm_provider '%s' — falling back to Kimi", provider
        )
        from .kimi_llm import KimiLLM
        kwargs = {}
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        if model:
            kwargs["model"] = model
        llm = KimiLLM(**kwargs)

    logger.info(
        "LLM instantiated: %s (provider=%s, model=%s, max_tokens=%s)",
        type(llm).__name__, provider,
        model or settings.llm_model,
        max_tokens or "default",
    )
    return llm
