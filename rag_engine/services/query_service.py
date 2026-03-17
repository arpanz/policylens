"""Handles end-to-end query: preprocess → embed → retrieve → rerank → build context → LLM → format response."""

from __future__ import annotations

from rag_engine.prompts.response_format import ResponseFormatter
from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)


class QueryService:
    """End-to-end query pipeline: retrieve → rerank → context → LLM → format."""

    def __init__(self) -> None:
        from rag_engine.embeddings.embedding_factory import get_embedder
        from rag_engine.llm.llm_factory import get_llm
        from rag_engine.retrieval.context_builder import ContextBuilder
        from rag_engine.retrieval.reranker import CrossEncoderReranker
        from rag_engine.retrieval.retriever import PolicyRetriever
        from rag_engine.vector_store.store_factory import get_vector_store

        self._embedder = get_embedder()
        self._store = get_vector_store()
        self._retriever = PolicyRetriever(self._store, self._embedder)
        self._reranker = CrossEncoderReranker()
        self._context_builder = ContextBuilder()
        self._llm = get_llm()
        self._formatter = ResponseFormatter()
        logger.info("QueryService initialized — all components ready")

    # ------------------------------------------------------------------ #
    #  single-policy query
    # ------------------------------------------------------------------ #
    def query(
        self,
        question: str,
        policy_id: str,
        k: int = 5,           # reduced from 8 — fetch 5 candidates
        top_k_rerank: int = 3, # reduced from 5 — keep top 3 after rerank
    ) -> dict:
        """Answer *question* using chunks from *policy_id*."""
        logger.info(
            "QueryService.query START | policy_id=%s | q='%s'",
            policy_id,
            question[:60],
        )

        # Step 1 — retrieve
        raw_results = self._retriever.retrieve(question, policy_id, k=k)

        # Step 2 — rerank
        reranked = self._reranker.rerank(question, raw_results, top_k=top_k_rerank)

        # Step 3 — build context
        context = self._context_builder.build(reranked)

        # Step 4 — build prompt
        from rag_engine.prompts.context_template import build_query_prompt
        from rag_engine.prompts.system_prompt import SYSTEM_PROMPT

        prompt = build_query_prompt(question, context, policy_id)

        # Step 5 — LLM
        raw_answer = self._llm.complete(prompt, system=SYSTEM_PROMPT)

        # Step 6 — format
        result = self._formatter.format_answer(raw_answer, question, reranked)

        logger.info(
            "QueryService.query COMPLETE | sources=%d",
            result["source_count"],
        )
        return result

    def stream_query(
        self,
        question: str,
        policy_id: str,
        k: int = 5,           # reduced from 8
        top_k_rerank: int = 3, # reduced from 5
    ):
        """Answer *question* via stream using chunks from *policy_id*."""
        logger.info(
            "QueryService.stream_query START | policy_id=%s | q='%s'",
            policy_id,
            question[:60],
        )

        # Step 1 — retrieve
        raw_results = self._retriever.retrieve(question, policy_id, k=k)

        # Step 2 — rerank
        reranked = self._reranker.rerank(question, raw_results, top_k=top_k_rerank)

        # Step 3 — build context
        context = self._context_builder.build(reranked)

        # Step 4 — build prompt
        from rag_engine.prompts.context_template import build_query_prompt
        from rag_engine.prompts.system_prompt import SYSTEM_PROMPT

        prompt = build_query_prompt(question, context, policy_id)

        # Step 5 — LLM Stream
        for token in self._llm.stream(prompt, system=SYSTEM_PROMPT):
            yield token

    # ------------------------------------------------------------------ #
    #  multi-policy query
    # ------------------------------------------------------------------ #
    def query_multi_policy(
        self, question: str, policy_ids: list[str]
    ) -> dict:
        """Answer *question* across multiple policies."""
        raw_results = self._retriever.retrieve_multi_policy(
            question, policy_ids, k_per_policy=3  # reduced from 4
        )
        reranked = self._reranker.rerank(question, raw_results, top_k=3)  # reduced from 5
        context = self._context_builder.build(reranked)

        from rag_engine.prompts.context_template import build_query_prompt
        from rag_engine.prompts.system_prompt import SYSTEM_PROMPT

        prompt = build_query_prompt(
            question, context, f"Multi-policy: {', '.join(policy_ids)}"
        )
        raw_answer = self._llm.complete(prompt, system=SYSTEM_PROMPT)
        return self._formatter.format_answer(raw_answer, question, reranked)
