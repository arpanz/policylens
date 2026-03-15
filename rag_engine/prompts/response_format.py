"""Format raw LLM answers into structured response dicts."""

from __future__ import annotations

# Chunks with a rerank score below this threshold are too weakly relevant
# to surface to the frontend as cited sources.
MIN_RELEVANCE_SCORE: float = -1.0


class ResponseFormatter:
    """Turn a raw answer + chunk metadata into a clean API-ready dict."""

    def format_answer(
        self,
        raw_answer: str,
        query: str,
        chunks_used: list[dict],
    ) -> dict:
        """Return a structured response with answer, sources, and metadata."""
        # Filter to only genuinely relevant chunks before exposing to frontend
        relevant_chunks = [
            chunk for chunk in chunks_used
            if chunk.get("rerank_score", chunk.get("score", 0)) >= MIN_RELEVANCE_SCORE
        ]

        # Always show at least 1 source (the best one) even if all scores are low
        if not relevant_chunks and chunks_used:
            relevant_chunks = chunks_used[:1]

        return {
            "answer": raw_answer.strip(),
            "query": query,
            "sources": [
                {
                    "section": chunk["metadata"].get("section_name", "Unknown"),
                    "clause_type": chunk["metadata"].get("clause_type", "Unknown"),
                    "page_number": chunk["metadata"].get("page_number"),
                    # Full chunk text — frontend uses this to search and highlight exact passage in PDF viewer
                    "highlight_text": chunk["content"],
                    "relevance_score": round(
                        chunk.get("rerank_score", chunk.get("score", 0)), 4
                    ),
                    "snippet": (
                        chunk["content"][:200] + "..."
                        if len(chunk["content"]) > 200
                        else chunk["content"]
                    ),
                }
                for chunk in relevant_chunks
            ],
            "source_count": len(relevant_chunks),
            "policy_id": (
                chunks_used[0]["metadata"].get("policy_id")
                if chunks_used
                else None
            ),
        }
