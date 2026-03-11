"""Abstract base class for all LLM providers."""

from __future__ import annotations

from abc import ABC, abstractmethod

import tiktoken


class BaseLLM(ABC):
    """Interface every LLM backend must implement."""

    @abstractmethod
    def complete(self, prompt: str, system: str | None = None) -> str:
        """Send a single user prompt (with optional system message) and return the response."""
        ...

    @abstractmethod
    def complete_with_messages(self, messages: list[dict]) -> str:
        """Send a full message list and return the assistant response."""
        ...

    @property
    @abstractmethod
    def model_id(self) -> str:
        """Return the canonical model identifier."""
        ...

    # ── concrete helper ─────────────────────────────────────────────── #
    def count_tokens(self, text: str) -> int:
        """Estimate token count using the cl100k_base encoding."""
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
