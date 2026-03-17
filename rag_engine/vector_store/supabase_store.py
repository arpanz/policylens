"""Supabase-backed vector store (pgvector under the hood)."""

from __future__ import annotations

from supabase import create_client

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from rag_engine.utils.retry import with_retry
from .base_store import BaseVectorStore

logger = get_logger(__name__)

_BATCH_SIZE = 50


class SupabaseVectorStore(BaseVectorStore):
    """Store and retrieve policy-chunk embeddings via Supabase."""

    def __init__(self) -> None:
        self._client = create_client(settings.supabase_url, settings.supabase_service_key)
        self._table = settings.vector_table_name
        logger.info("SupabaseVectorStore connected | table=%s", self._table)

    # ------------------------------------------------------------------ #
    #  write
    # ------------------------------------------------------------------ #
    @with_retry(max_retries=3, delay=1.0, backoff=2.0)
    def add_chunks(self, chunks: list[tuple[str, list[float], dict]]) -> None:
        rows = [
            {"content": text, "embedding": vector, "metadata": meta}
            for text, vector, meta in chunks
        ]
        total = (len(rows) + _BATCH_SIZE - 1) // _BATCH_SIZE
        for i in range(0, len(rows), _BATCH_SIZE):
            batch = rows[i : i + _BATCH_SIZE]
            batch_num = i // _BATCH_SIZE + 1
            logger.info("Inserting batch %d/%d (%d rows) to Supabase...", batch_num, total, len(batch))
            try:
                res = self._client.table(self._table).insert(batch).execute()
                logger.info("Batch %d/%d stored successfully (%d rows)", batch_num, total, len(batch))
            except Exception as e:
                logger.error("FAILED to store batch %d/%d: %s", batch_num, total, str(e))
                raise e
        logger.info("Successfully stored %d chunks in Supabase", len(chunks))

    # ------------------------------------------------------------------ #
    #  read
    # ------------------------------------------------------------------ #
    @with_retry(max_retries=3, delay=1.0, backoff=2.0)
    def similarity_search(
        self,
        query_embedding: list[float],
        k: int = 8,
        filter_dict: dict | None = None,
    ) -> list[dict]:
        response = self._client.rpc(
            "match_policy_chunks",
            {
                "query_embedding": query_embedding,
                "match_count": k,
                "filter": filter_dict or {},
            },
        ).execute()
        results = [
            {
                "content": r["content"],
                "metadata": r["metadata"],
                "score": r["similarity"],
            }
            for r in response.data
        ]
        logger.info("similarity_search | k=%d | returned %d results", k, len(results))
        return results

    # ------------------------------------------------------------------ #
    #  delete / exists
    # ------------------------------------------------------------------ #
    def delete_policy(self, policy_id: str) -> None:
        self._client.table(self._table).delete().filter(
            "metadata->>policy_id", "eq", policy_id
        ).execute()
        logger.info("Deleted all chunks for policy_id=%s", policy_id)

    def policy_exists(self, policy_id: str) -> bool:
        response = (
            self._client.table(self._table)
            .select("id", count="exact")
            .filter("metadata->>policy_id", "eq", policy_id)
            .execute()
        )
        return (response.count or 0) > 0

    def get_policy_chunk_count(self, policy_id: str) -> int:
        response = (
            self._client.table(self._table)
            .select("id", count="exact")
            .filter("metadata->>policy_id", "eq", policy_id)
            .execute()
        )
        return response.count or 0
