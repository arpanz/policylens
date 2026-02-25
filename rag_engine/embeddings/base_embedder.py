"""Abstract base class for all embedding providers."""

from abc import ABC, abstractmethod


class BaseEmbedder(ABC):
    """Interface every embedder must implement."""

    @abstractmethod
    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string and return its vector."""
        ...

    @abstractmethod
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of document strings and return their vectors."""
        ...

    @property
    @abstractmethod
    def model_id(self) -> str:
        """Return the canonical model identifier."""
        ...

    # ── concrete helper ──────────────────────────────────────────────
    def get_dimension(self) -> int:
        """Return the dimensionality of the embedding vectors."""
        return len(self.embed_query("dimension test"))
