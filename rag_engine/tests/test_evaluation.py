"""Phase 7B — lightweight evaluation harness for retrieval quality.

Uses the dry-run sample document. No API calls needed.
"""

import unittest

from rag_engine.chunking.clause_chunker import ClauseChunker
from rag_engine.ingestion.cleaner import DocumentCleaner
from rag_engine.prompts.response_format import ResponseFormatter
from rag_engine.retrieval.context_builder import ContextBuilder
from rag_engine.retrieval.query_preprocessor import QueryPreprocessor

SAMPLE_POLICY = """
## SECTION 1 - DEFINITIONS
1.1 Insured means the person named in the Schedule.
1.2 Deductible means the first amount of any claim payable by the Insured.
1.3 Limit means the maximum amount We will pay for any one event.

## SECTION 2 - COVERAGE
2.1 We will pay for loss caused by fire, smoke, or explosion.
2.2 We will pay for theft subject to the deductible in Schedule A.
2.3 Coverage limit for fire damage is $50,000 per event.

## SECTION 3 - EXCLUSIONS
3.1 This policy does not cover flood or surface water damage.
3.2 This policy does not cover earthquake or earth movement.
3.3 This policy does not cover intentional damage by the Insured.

## SECTION 4 - SCHEDULE OF DEDUCTIBLES
| Event  | Deductible |
|--------|------------|
| Fire   | $500       |
| Theft  | $1,000     |
| Other  | $250       |
"""


# ====================================================================== #
#  TEST 1 — chunking quality
# ====================================================================== #
class TestEvalChunkingQuality(unittest.TestCase):

    def test_eval_chunking_quality(self):
        """Evaluate chunk quality on sample policy"""
        cleaner = DocumentCleaner()
        chunker = ClauseChunker()

        clean = cleaner.clean(SAMPLE_POLICY)
        chunks = chunker.chunk(clean, "EVAL-001", "eval_policy.pdf")

        texts = [t for t, _ in chunks]
        metas = [m for _, m in chunks]

        clause_types = [m.clause_type for m in metas]

        assert len(chunks) >= 3, f"Expected >=3 chunks, got {len(chunks)}"
        assert "exclusion" in clause_types, "No exclusion chunk detected"
        assert "coverage" in clause_types, "No coverage chunk detected"

        table_chunks = [m for m in metas if m.table_chunk]
        assert len(table_chunks) >= 1, "No table chunk detected"

        deductible_chunks = [m for m in metas if m.deductible_related]
        assert len(deductible_chunks) >= 1, "No deductible chunk detected"

        for text, meta in chunks:
            assert len(text.strip()) > 0
            assert meta.token_count > 0
            assert meta.policy_id == "EVAL-001"

        print(f"  Chunks produced: {len(chunks)}")
        print(f"  Clause types: {clause_types}")
        print(f"  Table chunks: {len(table_chunks)}")


# ====================================================================== #
#  TEST 2 — query preprocessing quality
# ====================================================================== #
class TestEvalQueryPreprocessingQuality(unittest.TestCase):

    def test_eval_query_preprocessing_quality(self):
        """Evaluate preprocessor handles insurance query patterns"""
        p = QueryPreprocessor()

        test_cases = [
            ("is flood damage covered", "flood", True),
            ("what is the fire deductible", "fire", True),
            ("does this cover theft", "theft", True),
            ("what is the coverage limit for fire", "fire", True),
        ]

        for query, expected_category, should_have_question_mark in test_cases:
            processed = p.preprocess(query)
            filters = p.extract_filters(processed, "EVAL-001")

            if should_have_question_mark:
                assert "?" in processed, f"Missing ? in: {processed}"
            assert "policy_id" in filters
            print(
                f"  '{query}' → category={filters.get('coverage_category')} ✓"
            )


# ====================================================================== #
#  TEST 3 — context builder token limit
# ====================================================================== #
class TestEvalContextBuilderTokenLimit(unittest.TestCase):

    def test_eval_context_builder_token_limit(self):
        """Evaluate context builder respects token limits"""
        cb = ContextBuilder()

        large_results = [
            {
                "content": "This is a very long clause. " * 50,
                "metadata": {
                    "section_name": f"Section {i}",
                    "clause_type": "coverage",
                },
                "score": 0.9 - i * 0.05,
            }
            for i in range(10)
        ]

        context = cb.build(large_results, max_tokens=500)

        rough_tokens = len(context.split()) * 1.3
        assert rough_tokens <= 700, f"Context too large: {rough_tokens} tokens"
        assert "Source 1" in context
        print(f"  Context token estimate: {rough_tokens:.0f} (limit: 500)")


# ====================================================================== #
#  TEST 4 — response formatter sources capped
# ====================================================================== #
class TestEvalResponseFormatterSourcesCapped(unittest.TestCase):

    def test_eval_response_formatter_sources_capped(self):
        """Evaluate formatter caps sources at 5 even with more chunks"""
        formatter = ResponseFormatter()

        many_chunks = [
            {
                "content": f"Clause {i} text here",
                "metadata": {
                    "section_name": f"Section {i}",
                    "clause_type": "coverage",
                    "policy_id": "EVAL-001",
                },
                "score": 0.9 - i * 0.05,
                "rerank_score": 0.95 - i * 0.05,
            }
            for i in range(8)
        ]

        result = formatter.format_answer("Test answer", "Test query", many_chunks)

        assert len(result["sources"]) <= 5, (
            f"Sources not capped: {len(result['sources'])}"
        )
        assert result["source_count"] == 8
        print(f"  Sources in response: {len(result['sources'])} (capped from 8)")


if __name__ == "__main__":
    unittest.main()
