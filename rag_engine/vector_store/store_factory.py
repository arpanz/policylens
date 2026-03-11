"""Factory for vector-store backends."""

from __future__ import annotations

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from .base_store import BaseVectorStore

logger = get_logger(__name__)


def get_vector_store(provider: str | None = None) -> BaseVectorStore:
    """Instantiate a vector store by *provider* name.

    Falls back to ``settings.vector_store_provider`` (default ``"supabase"``).
    """
    provider = (provider or settings.vector_store_provider).lower().strip()

    if provider == "supabase":
        from .supabase_store import SupabaseVectorStore

        store = SupabaseVectorStore()
    else:
        logger.warning(
            "Unknown vector_store_provider '%s' — falling back to Supabase", provider
        )
        from .supabase_store import SupabaseVectorStore

        store = SupabaseVectorStore()

    logger.info("Vector store instantiated: %s", type(store).__name__)
    return store
