"""Gemini LLM backend via google-generativeai SDK."""

from __future__ import annotations

import google.generativeai as genai

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from rag_engine.utils.retry import with_retry
from .base_llm import BaseLLM

logger = get_logger(__name__)


class GeminiLLM(BaseLLM):
    """Chat completion via Google Gemini API (google-generativeai SDK)."""

    def __init__(
        self,
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> None:
        self._model_name = model or settings.gemini_model
        self._temperature = temperature
        self._max_tokens = max_tokens

        genai.configure(api_key=settings.gemini_api_key)
        self._client = genai.GenerativeModel(
            model_name=self._model_name,
            generation_config=genai.GenerationConfig(
                temperature=self._temperature,
                max_output_tokens=self._max_tokens,
            ),
        )
        logger.info("GeminiLLM initialized | model=%s", self._model_name)

    # ------------------------------------------------------------------ #
    #  complete
    # ------------------------------------------------------------------ #
    def complete(self, prompt: str, system: str | None = None) -> str:
        messages = []
        if system:
            messages.append({"role": "user", "parts": [system]})
            messages.append({"role": "model", "parts": ["Understood."]})
        messages.append({"role": "user", "parts": [prompt]})
        return self._complete_messages(messages)

    @with_retry(max_retries=4, delay=5.0, backoff=2.0)
    def _complete_messages(self, messages: list[dict]) -> str:
        response = self._client.generate_content(messages)
        result = response.text
        logger.info(
            "GeminiLLM response | model=%s | chars=%d",
            self._model_name,
            len(result) if result else 0,
        )
        return result or ""

    def complete_with_messages(self, messages: list[dict]) -> str:
        """Accept OpenAI-style {role, content} dicts and convert to Gemini format."""
        gemini_msgs = []
        system_text = None
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_text = content
            elif role == "user":
                if system_text:
                    gemini_msgs.append({"role": "user", "parts": [system_text]})
                    gemini_msgs.append({"role": "model", "parts": ["Understood."]})
                    system_text = None
                gemini_msgs.append({"role": "user", "parts": [content]})
            elif role == "assistant":
                gemini_msgs.append({"role": "model", "parts": [content]})
        return self._complete_messages(gemini_msgs)

    # ------------------------------------------------------------------ #
    #  streaming
    # ------------------------------------------------------------------ #
    def stream(self, prompt: str, system: str | None = None):
        messages = []
        if system:
            messages.append({"role": "user", "parts": [system]})
            messages.append({"role": "model", "parts": ["Understood."]})
        messages.append({"role": "user", "parts": [prompt]})
        return self.stream_with_messages(messages)

    def stream_with_messages(self, messages: list[dict]):
        """Accept OpenAI-style dicts, convert, and stream."""
        gemini_msgs = []
        system_text = None
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_text = content
            elif role == "user":
                if system_text:
                    gemini_msgs.append({"role": "user", "parts": [system_text]})
                    gemini_msgs.append({"role": "model", "parts": ["Understood."]})
                    system_text = None
                gemini_msgs.append({"role": "user", "parts": [content]})
            elif role == "assistant":
                gemini_msgs.append({"role": "model", "parts": [content]})

        response_stream = self._client.generate_content(gemini_msgs, stream=True)
        for chunk in response_stream:
            if chunk.text:
                yield chunk.text

    # ------------------------------------------------------------------ #
    #  model_id
    # ------------------------------------------------------------------ #
    @property
    def model_id(self) -> str:
        return self._model_name
