"""Cross-encoder reranker for retrieved chunks."""

from __future__ import annotations

from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)


class CrossEncoderReranker:
    """Re-score and re-order retrieval results with a cross-encoder model."""

    def __init__(
        self, model_name: str = "cross-encoder/ms-marco-TinyBERT-L-2-v2"
    ) -> None:
        from sentence_transformers import CrossEncoder

        self._model = CrossEncoder(model_name)
        self._model_name = model_name
        logger.info("CrossEncoderReranker loaded: %s", model_name)

    # ------------------------------------------------------------------ #
    #  rerank
    # ------------------------------------------------------------------ #
    def rerank(
        self, query: str, results: list[dict], top_k: int = 5
    ) -> list[dict]:
        """Return the top-*top_k* results re-scored by the cross-encoder."""
        if not results:
            return []

        pairs = [[query, r["content"]] for r in results]
        scores = self._model.predict(pairs)

        for result, score in zip(results, scores):
            result["rerank_score"] = float(score)

        results.sort(key=lambda r: r["rerank_score"], reverse=True)
        top_results = results[:top_k]

        logger.info("Reranked %d → %d results", len(results), top_k)
        return top_results
