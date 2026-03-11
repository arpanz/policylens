"""Build the user-facing query prompt that wraps context + question."""

from __future__ import annotations


def build_query_prompt(
    query: str, context: str, policy_id: str | None = None
) -> str:
    """Return a formatted prompt containing *context*, *query*, and *policy_id*."""
    return (
        f"INSURANCE POLICY CONTEXT:\n"
        f"{context}\n\n"
        f"---\n\n"
        f"QUESTION: {query}\n\n"
        f"POLICY ID: {policy_id or 'Not specified'}\n\n"
        f"Please answer the question based strictly on the policy context "
        f"provided above. Cite specific sections where applicable."
    )
