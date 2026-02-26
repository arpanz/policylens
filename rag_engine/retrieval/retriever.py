"""Core retriever — ties vector store + embedder + preprocessing together."""

from __future__ import annotations

from rag_engine.embeddings.base_embedder import BaseEmbedder
from rag_engine.utils.logger import get_logger
from rag_engine.vector_store.base_store import BaseVectorStore
from .query_preprocessor import QueryPreprocessor

logger = get_logger(__name__)


class PolicyRetriever:
    """Retrieve relevant policy chunks for a user query."""

    def __init__(
        self, vector_store: BaseVectorStore, embedder: BaseEmbedder
    ) -> None:
        self._store = vector_store
        self._embedder = embedder
        self._preprocessor = QueryPreprocessor()
        logger.info("PolicyRetriever initialized")

    # ------------------------------------------------------------------ #
    #  single-policy retrieve
    # ------------------------------------------------------------------ #
    def retrieve(self, query: str, policy_id: str, k: int = 8) -> list[dict]:
        """Return the top-*k* chunks for *query* scoped to *policy_id*."""
        clean_query = self._preprocessor.preprocess(query)
        filters = self._preprocessor.extract_filters(clean_query, policy_id)
        query_embedding = self._embedder.embed_query(clean_query)

        results = self._store.similarity_search(
            query_embedding=query_embedding,
            k=k,
            filter_dict=filters,
        )

        if len(results) == 0:
            logger.warning(
                "No results for policy_id=%s, retrying without filters",
                policy_id,
            )
            results = self._store.similarity_search(
                query_embedding=query_embedding,
                k=k,
                filter_dict={"policy_id": policy_id},
            )

        logger.info(
            "Retrieved %d chunks for query='%s'", len(results), clean_query[:50]
        )
        return results

    # ------------------------------------------------------------------ #
    #  multi-policy retrieve
    # ------------------------------------------------------------------ #
    def retrieve_multi_policy(
        self,
        query: str,
        policy_ids: list[str],
        k_per_policy: int = 4,
    ) -> list[dict]:
        """Retrieve across several policies and return a merged, ranked list."""
        merged: list[dict] = []
        for pid in policy_ids:
            merged.extend(self.retrieve(query, pid, k_per_policy))

        merged.sort(key=lambda r: r.get("score", 0), reverse=True)

        top_n = k_per_policy * len(policy_ids)
        merged = merged[:top_n]

        logger.info(
            "Multi-policy retrieve | %d policies | %d total results",
            len(policy_ids),
            len(merged),
        )
        return merged
