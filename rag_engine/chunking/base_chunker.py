"""Abstract base for chunkers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Tuple

from rag_engine.schemas.chunk_metadata import ChunkMetadata


class BaseChunker(ABC):

    @abstractmethod
    def chunk(
        self,
        text: str,
        policy_id: str,
        source_file: str,
    ) -> List[Tuple[str, ChunkMetadata]]:
        ...
