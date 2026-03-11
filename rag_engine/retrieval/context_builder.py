"""Build the final context string fed to the LLM from retrieved chunks."""

from __future__ import annotations

from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

_TOKEN_MULTIPLIER = 1.3  # rough word → token ratio


class ContextBuilder:
    """Assemble a formatted context block from scored retrieval results."""

    def build(self, results: list[dict], max_tokens: int = 3000) -> str:
        """Format *results* into a single context string, respecting *max_tokens*."""
        parts: list[str] = []
        token_estimate = 0.0
        used = 0

        for i, result in enumerate(results):
            metadata = result.get("metadata", {})
            score = result.get("rerank_score", result.get("score", 0))
            content = result.get("content", "")

            block = (
                f"--- Source {i + 1} ---\n"
                f"Section: {metadata.get('section_name', 'Unknown')}\n"
                f"Clause Type: {metadata.get('clause_type', 'Unknown')}\n"
                f"Relevance: {score:.3f}\n\n"
                f"{content}\n"
            )

            block_tokens = len(block.split()) * _TOKEN_MULTIPLIER
            if token_estimate + block_tokens > max_tokens and used > 0:
                break

            parts.append(block)
            token_estimate += block_tokens
            used += 1

        context = "\n".join(parts)
        logger.info(
            "Context built: %d/%d chunks, ~%d tokens",
            used,
            len(results),
            int(token_estimate),
        )
        return context
