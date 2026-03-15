"""Auto-generate a structured JSON summary for an ingested policy."""

from __future__ import annotations

import json

from supabase import create_client

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

# Fixed internal query used to pull the most relevant overview chunks.
_INTERNAL_QUERY = (
    "policy overview benefits coverage exclusions surrender "
    "death benefit premiums"
)

_SUMMARY_SYSTEM_PROMPT = """You are an insurance policy analyst. Given raw policy document chunks, extract and return a structured JSON summary with these exact keys:

{
  "policy_name": "full official name of the policy",
  "policy_type": "e.g. Deferred Annuity / Term Life / Health etc",
  "insurer": "name of the insurance company",
  "uin": "UIN number if present",
  "key_benefits": ["list of 4-6 main benefits as short strings"],
  "exclusions": ["list of 4-6 main exclusions as short strings"],
  "death_benefit": "1-2 sentence summary of death benefit",
  "survival_benefit": "1-2 sentence summary of survival/maturity benefit",
  "surrender_value": "1-2 sentence summary of surrender conditions",
  "loan_facility": "1-2 sentence summary or null if not available",
  "free_look_period": "e.g. 15 days or 30 days",
  "tax_benefit": "1-2 sentence summary or null",
  "important_conditions": ["list of 3-5 important conditions/clauses"]
}

Return ONLY valid JSON. No explanation. No markdown. Just the JSON object."""

_SUMMARY_TABLE = "policy_summaries"


class SummaryService:
    """Generate, store, and fetch structured policy summaries."""

    def __init__(self) -> None:
        from rag_engine.embeddings.embedding_factory import get_embedder
        from rag_engine.llm.llm_factory import get_llm
        from rag_engine.retrieval.context_builder import ContextBuilder
        from rag_engine.retrieval.retriever import PolicyRetriever
        from rag_engine.vector_store.store_factory import get_vector_store

        self._embedder = get_embedder()
        self._store = get_vector_store()
        self._retriever = PolicyRetriever(self._store, self._embedder)
        self._context_builder = ContextBuilder()
        self._llm = get_llm()
        self._supabase = create_client(
            settings.supabase_url, settings.supabase_service_key
        )
        logger.info("SummaryService initialized")

    # ------------------------------------------------------------------ #
    #  generate
    # ------------------------------------------------------------------ #
    def generate(self, policy_id: str) -> dict:
        """Retrieve top chunks and ask the LLM for a structured summary.

        Returns the parsed summary dict.
        """
        logger.info("SummaryService.generate START | policy_id=%s", policy_id)

        # Step 1 — retrieve top 15 chunks using a fixed internal query
        raw_results = self._retriever.retrieve(
            _INTERNAL_QUERY, policy_id, k=15
        )

        if not raw_results:
            logger.warning(
                "No chunks found for policy_id=%s — cannot generate summary",
                policy_id,
            )
            return {"error": "no_chunks", "policy_id": policy_id}

        # Step 2 — build context from retrieved chunks
        context = self._context_builder.build(raw_results, max_tokens=4000)

        # Step 3 — send to LLM with structured extraction prompt
        user_prompt = (
            f"Here are the policy document chunks for policy {policy_id}:\n\n"
            f"{context}\n\n"
            "Extract the structured summary as specified."
        )
        raw_response = self._llm.complete(
            user_prompt, system=_SUMMARY_SYSTEM_PROMPT
        )

        # Step 4 — parse JSON response
        summary = self._parse_json(raw_response)

        logger.info(
            "SummaryService.generate COMPLETE | policy_id=%s | keys=%s",
            policy_id,
            list(summary.keys()) if isinstance(summary, dict) else "parse_error",
        )
        return summary

    # ------------------------------------------------------------------ #
    #  store
    # ------------------------------------------------------------------ #
    def store(self, policy_id: str, summary: dict) -> None:
        """Upsert the summary into the policy_summaries table."""
        self._supabase.table(_SUMMARY_TABLE).upsert(
            {"policy_id": policy_id, "summary": summary},
            on_conflict="policy_id",
        ).execute()
        logger.info("Stored summary for policy_id=%s", policy_id)

    # ------------------------------------------------------------------ #
    #  fetch
    # ------------------------------------------------------------------ #
    def fetch(self, policy_id: str) -> dict | None:
        """Retrieve a stored summary. Returns None if not found."""
        response = (
            self._supabase.table(_SUMMARY_TABLE)
            .select("policy_id, summary, created_at")
            .eq("policy_id", policy_id)
            .execute()
        )
        if response.data:
            return response.data[0]
        return None

    # ------------------------------------------------------------------ #
    #  helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _parse_json(raw: str) -> dict:
        """Best-effort parse of the LLM JSON output."""
        text = raw.strip()
        # Strip markdown code fences if the LLM wraps the output
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[: -3].strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse LLM JSON: %s", exc)
            return {"raw_response": raw, "parse_error": str(exc)}
