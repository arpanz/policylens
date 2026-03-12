"""Format raw LLM answers into structured response dicts."""

from __future__ import annotations


class ResponseFormatter:
    """Turn a raw answer + chunk metadata into a clean API-ready dict."""

    def format_answer(
        self,
        raw_answer: str,
        query: str,
        chunks_used: list[dict],
    ) -> dict:
        """Return a structured response with answer, sources, and metadata."""
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
                for chunk in chunks_used[:5]
            ],
            "source_count": len(chunks_used),
            "policy_id": (
                chunks_used[0]["metadata"].get("policy_id")
                if chunks_used
                else None
            ),
        }
