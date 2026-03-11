"""Pre-process user queries before retrieval."""

from __future__ import annotations

import re

from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

_QUESTION_STARTERS = re.compile(
    r"^(what|is|are|does|do|can|will|how|when|where|why)\b", re.IGNORECASE
)

_FLOOD_KEYWORDS = {"flood", "water", "storm", "hurricane"}
_FIRE_KEYWORDS = {"fire", "smoke", "explosion", "burn"}
_THEFT_KEYWORDS = {"theft", "stolen", "burglary", "robbery"}
_DEDUCTIBLE_KEYWORDS = {"deductible", "excess", "out-of-pocket"}
_LIMIT_KEYWORDS = {"limit", "maximum", "cap", "ceiling"}


class QueryPreprocessor:
    """Clean and enrich user queries for retrieval."""

    # ------------------------------------------------------------------ #
    #  preprocess
    # ------------------------------------------------------------------ #
    def preprocess(self, query: str) -> str:
        """Normalise whitespace and append ``?`` to question-like queries."""
        original = query
        result = query.strip()

        # Append "?" for question-like phrases that don't already end with one
        if not result.endswith("?") and _QUESTION_STARTERS.match(result):
            # Capitalise the first letter of question-like phrases
            if result:
                result = result[0].upper() + result[1:]
            result = result + "?"

        # Collapse multiple spaces
        result = re.sub(r"\s+", " ", result)

        logger.info("Query preprocessed: '%s' → '%s'", original, result)
        return result

    # ------------------------------------------------------------------ #
    #  extract_filters
    # ------------------------------------------------------------------ #
    def extract_filters(self, query: str, policy_id: str | None = None) -> dict:
        """Build a Supabase metadata filter dict from *query* keywords."""
        filters: dict = {}

        if policy_id is not None:
            filters["policy_id"] = policy_id

        lower = query.lower()
        words = set(lower.split())

        if words & _FLOOD_KEYWORDS:
            filters["coverage_category"] = "flood"
        if words & _FIRE_KEYWORDS:
            filters["coverage_category"] = "fire"
        if words & _THEFT_KEYWORDS:
            filters["coverage_category"] = "theft"
        if words & _DEDUCTIBLE_KEYWORDS:
            filters["deductible_related"] = True
        if words & _LIMIT_KEYWORDS:
            filters["limit_related"] = True

        logger.info("Extracted filters: %s", filters)
        return filters
