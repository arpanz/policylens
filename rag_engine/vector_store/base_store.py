"""Abstract base class for vector stores."""

from abc import ABC, abstractmethod


class BaseVectorStore(ABC):
    """Interface every vector-store backend must implement."""

    @abstractmethod
    def add_chunks(self, chunks: list[tuple[str, list[float], dict]]) -> None:
        """Persist ``(text, embedding_vector, metadata_dict)`` tuples."""
        ...

    @abstractmethod
    def similarity_search(
        self,
        query_embedding: list[float],
        k: int = 8,
        filter_dict: dict | None = None,
    ) -> list[dict]:
        """Return top-*k* results as ``[{content, metadata, score}]``."""
        ...

    @abstractmethod
    def delete_policy(self, policy_id: str) -> None:
        """Remove every chunk belonging to *policy_id*."""
        ...

    @abstractmethod
    def policy_exists(self, policy_id: str) -> bool:
        """Return ``True`` if at least one chunk exists for *policy_id*."""
        ...
