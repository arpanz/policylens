"""Kimi / Moonshot LLM backend (OpenAI-compatible API)."""

from __future__ import annotations

from openai import OpenAI

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from rag_engine.utils.retry import with_retry
from .base_llm import BaseLLM

logger = get_logger(__name__)


class KimiLLM(BaseLLM):
    """Chat completion via Moonshot's Kimi API (OpenAI-compatible)."""

    def __init__(
        self,
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> None:
        self._model = model or settings.kimi_model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._client = OpenAI(
            api_key=settings.moonshot_api_key,
            base_url=settings.kimi_base_url,
        )
        logger.info(
            "KimiLLM initialized | model=%s | base_url=%s",
            self._model,
            settings.kimi_base_url,
        )

    # ------------------------------------------------------------------ #
    #  complete
    # ------------------------------------------------------------------ #
    def complete(self, prompt: str, system: str | None = None) -> str:
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self.complete_with_messages(messages)

    # ------------------------------------------------------------------ #
    #  complete_with_messages — retries with longer waits for 429 overload
    # ------------------------------------------------------------------ #
    @with_retry(max_retries=4, delay=5.0, backoff=2.0)
    def complete_with_messages(self, messages: list[dict]) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
            stream=False,
        )
        result = response.choices[0].message.content
        logger.info(
            "KimiLLM response | model=%s | tokens_used=%s | chars=%d",
            self._model,
            response.usage.total_tokens if response.usage else "N/A",
            len(result) if result else 0,
        )
        return result or ""

    # ------------------------------------------------------------------ #
    #  streaming
    # ------------------------------------------------------------------ #
    def stream(self, prompt: str, system: str | None = None):
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self.stream_with_messages(messages)

    def stream_with_messages(self, messages: list[dict]):
        response_stream = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
            stream=True,
        )
        for chunk in response_stream:
            if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    # ------------------------------------------------------------------ #
    #  model_id
    # ------------------------------------------------------------------ #
    @property
    def model_id(self) -> str:
        return self._model
