"""Unit tests for retrieval components — no real embedder or Supabase calls."""

import unittest
from unittest.mock import MagicMock

from rag_engine.retrieval.query_preprocessor import QueryPreprocessor
from rag_engine.retrieval.context_builder import ContextBuilder
from rag_engine.retrieval.retriever import PolicyRetriever


# ====================================================================== #
#  QueryPreprocessor
# ====================================================================== #
class TestQueryPreprocessor(unittest.TestCase):

    def setUp(self):
        self.p = QueryPreprocessor()

    def test_preprocessor_strips_whitespace(self):
        assert self.p.preprocess("  hello  ") == "hello"

    def test_preprocessor_adds_question_mark(self):
        assert "?" in self.p.preprocess("is fire covered")

    def test_preprocessor_no_double_question_mark(self):
        result = self.p.preprocess("is fire covered?")
        assert result.count("?") == 1

    def test_extract_filters_policy_id(self):
        filters = self.p.extract_filters("anything", policy_id="P1")
        assert filters["policy_id"] == "P1"

    def test_extract_filters_flood(self):
        filters = self.p.extract_filters("flood damage", policy_id="P1")
        assert filters["coverage_category"] == "flood"

    def test_extract_filters_deductible(self):
        filters = self.p.extract_filters("what is the deductible", "P1")
        assert filters["deductible_related"] is True


# ====================================================================== #
#  PolicyRetriever
# ====================================================================== #
class TestPolicyRetriever(unittest.TestCase):

    def _make_mocks(self):
        mock_store = MagicMock()
        mock_embedder = MagicMock()
        mock_embedder.embed_query.return_value = [0.1] * 768
        return mock_store, mock_embedder

    def test_retriever_calls_embed_and_search(self):
        mock_store, mock_embedder = self._make_mocks()
        mock_store.similarity_search.return_value = [
            {"content": "flood excluded", "metadata": {}, "score": 0.9}
        ]

        retriever = PolicyRetriever(mock_store, mock_embedder)
        results = retriever.retrieve("flood damage", "POL-001", k=5)

        mock_embedder.embed_query.assert_called_once()
        mock_store.similarity_search.assert_called_once()
        assert len(results) == 1

    def test_retriever_fallback_on_empty(self):
        mock_store, mock_embedder = self._make_mocks()
        # First call returns empty → triggers fallback; second call returns 1 result
        mock_store.similarity_search.side_effect = [
            [],
            [{"content": "fallback result", "metadata": {}, "score": 0.5}],
        ]

        retriever = PolicyRetriever(mock_store, mock_embedder)
        results = retriever.retrieve("flood damage", "POL-001")

        assert mock_store.similarity_search.call_count == 2


# ====================================================================== #
#  ContextBuilder
# ====================================================================== #
class TestContextBuilder(unittest.TestCase):

    def test_context_builder_formats_correctly(self):
        results = [
            {
                "content": "Flood is excluded",
                "metadata": {
                    "section_name": "Exclusions",
                    "clause_type": "exclusion",
                },
                "score": 0.95,
            }
        ]
        cb = ContextBuilder()
        context = cb.build(results)

        assert "Source 1" in context
        assert "Exclusions" in context
        assert "Flood is excluded" in context

    def test_context_builder_empty_input(self):
        cb = ContextBuilder()
        result = cb.build([])
        assert result == "" or result.strip() == ""


if __name__ == "__main__":
    unittest.main()
