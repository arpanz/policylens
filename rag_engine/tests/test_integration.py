"""Integration tests — wire together multiple real components, mock Supabase & LLM."""

import unittest
from unittest.mock import MagicMock, patch

from rag_engine.prompts.context_template import build_query_prompt
from rag_engine.prompts.response_format import ResponseFormatter
from rag_engine.prompts.system_prompt import SYSTEM_PROMPT
from rag_engine.retrieval.context_builder import ContextBuilder
from rag_engine.retrieval.query_preprocessor import QueryPreprocessor


# ====================================================================== #
#  TEST 1 — full retrieval-to-context pipeline
# ====================================================================== #
class TestFullRetrievalToContextPipeline(unittest.TestCase):

    def test_full_retrieval_to_context_pipeline(self):
        """query → preprocess → filter extraction → context build"""
        preprocessor = QueryPreprocessor()
        context_builder = ContextBuilder()

        query = "is flood damage covered"
        processed = preprocessor.preprocess(query)
        filters = preprocessor.extract_filters(processed, "POL-001")

        mock_results = [
            {
                "content": "Section 3.1: Flood damage is excluded.",
                "metadata": {
                    "section_name": "Exclusions",
                    "clause_type": "exclusion",
                    "policy_id": "POL-001",
                },
                "score": 0.94,
            },
            {
                "content": "Section 2.1: Fire damage is covered up to $50,000.",
                "metadata": {
                    "section_name": "Coverage",
                    "clause_type": "coverage",
                    "policy_id": "POL-001",
                },
                "score": 0.71,
            },
        ]

        context = context_builder.build(mock_results)

        assert "?" in processed
        assert filters["coverage_category"] == "flood"
        assert filters["policy_id"] == "POL-001"
        assert "Source 1" in context
        assert "Exclusions" in context
        assert "Section 3.1" in context


# ====================================================================== #
#  TEST 2 — prompt assembly
# ====================================================================== #
class TestPromptAssembly(unittest.TestCase):

    def test_prompt_assembly_with_context(self):
        """context + query → prompt is correctly assembled"""
        context = "--- Source 1 ---\nSection: Exclusions\n\nFlood is excluded."
        query = "Is flood covered?"
        policy_id = "POL-001"

        prompt = build_query_prompt(query, context, policy_id)

        assert "Is flood covered?" in prompt
        assert "Flood is excluded" in prompt
        assert "POL-001" in prompt
        assert "INSURANCE POLICY CONTEXT" in prompt
        assert len(SYSTEM_PROMPT) > 200
        assert "PolicyDecoder" in SYSTEM_PROMPT


# ====================================================================== #
#  TEST 3 — response formatter full structure
# ====================================================================== #
class TestResponseFormatterFullStructure(unittest.TestCase):

    def test_response_formatter_full_structure(self):
        """formatter returns all required fields with correct types"""
        formatter = ResponseFormatter()
        chunks = [
            {
                "content": "Flood is excluded under Section 3.1",
                "metadata": {
                    "section_name": "Exclusions",
                    "clause_type": "exclusion",
                    "policy_id": "POL-TEST",
                },
                "score": 0.93,
                "rerank_score": 0.97,
            },
            {
                "content": "Fire is covered up to $50,000",
                "metadata": {
                    "section_name": "Coverage",
                    "clause_type": "coverage",
                    "policy_id": "POL-TEST",
                },
                "score": 0.81,
                "rerank_score": 0.85,
            },
        ]

        result = formatter.format_answer(
            "Flood damage is not covered under this policy.",
            "Is flood covered?",
            chunks,
        )

        assert "answer" in result
        assert "sources" in result
        assert "source_count" in result
        assert "policy_id" in result
        assert result["answer"] == "Flood damage is not covered under this policy."
        assert result["source_count"] == 2
        assert result["policy_id"] == "POL-TEST"
        assert len(result["sources"]) == 2
        assert result["sources"][0]["section"] == "Exclusions"
        assert result["sources"][0]["relevance_score"] == 0.97
        assert result["sources"][1]["clause_type"] == "coverage"


# ====================================================================== #
#  TEST 4 — QueryService full flow (mocked)
# ====================================================================== #
class TestQueryServiceFullFlow(unittest.TestCase):

    @patch("rag_engine.embeddings.embedding_factory.get_embedder")
    @patch("rag_engine.vector_store.store_factory.get_vector_store")
    @patch("rag_engine.llm.llm_factory.get_llm")
    @patch("sentence_transformers.CrossEncoder")
    def test_query_service_full_flow_mocked(
        self, mock_ce_cls, mock_get_llm, mock_get_store, mock_get_emb
    ):
        """QueryService end-to-end with all external calls mocked"""
        # embedder
        mock_embedder = MagicMock()
        mock_embedder.embed_query.return_value = [0.1] * 768
        mock_get_emb.return_value = mock_embedder

        # vector store
        mock_store = MagicMock()
        mock_store.similarity_search.return_value = [
            {
                "content": "Flood is excluded per Section 3.1",
                "metadata": {
                    "section_name": "Exclusions",
                    "clause_type": "exclusion",
                    "policy_id": "POL-001",
                },
                "score": 0.94,
            }
        ]
        mock_get_store.return_value = mock_store

        # llm
        mock_llm = MagicMock()
        mock_llm.complete.return_value = "Flood damage is not covered."
        mock_get_llm.return_value = mock_llm

        # reranker — mock CrossEncoder so it doesn't download a model
        mock_ce = MagicMock()
        mock_ce.predict.return_value = [0.97]
        mock_ce_cls.return_value = mock_ce

        from rag_engine.services.query_service import QueryService

        service = QueryService()
        result = service.query("Is flood covered?", "POL-001")

        mock_embedder.embed_query.assert_called_once()
        mock_store.similarity_search.assert_called_once()
        mock_llm.complete.assert_called_once()

        assert result["answer"] == "Flood damage is not covered."
        assert result["policy_id"] == "POL-001"
        assert result["source_count"] == 1


# ====================================================================== #
#  TEST 5 — IngestionService skip existing
# ====================================================================== #
class TestIngestionServiceSkipExisting(unittest.TestCase):

    @patch("rag_engine.ingestion.pipeline.IngestionPipeline")
    @patch("rag_engine.embeddings.embedding_factory.get_embedder")
    @patch("rag_engine.vector_store.store_factory.get_vector_store")
    def test_ingestion_service_skip_existing(
        self, mock_get_store, mock_get_emb, mock_pipeline_cls
    ):
        """IngestionService skips if policy already exists"""
        mock_store = MagicMock()
        mock_store.policy_exists.return_value = True
        mock_store.get_policy_chunk_count.return_value = 42
        mock_get_store.return_value = mock_store

        from rag_engine.services.ingestion_service import IngestionService

        service = IngestionService()
        result = service.ingest("fake.pdf", "POL-EXISTS", overwrite=False)

        assert result["status"] == "skipped"
        assert result["chunks"] == 42
        assert result["reason"] == "already_exists"
        mock_store.policy_exists.assert_called_once_with("POL-EXISTS")


# ====================================================================== #
#  TEST 6 — IngestionService overwrite
# ====================================================================== #
class TestIngestionServiceOverwrite(unittest.TestCase):

    @patch("rag_engine.ingestion.pipeline.IngestionPipeline")
    @patch("rag_engine.embeddings.embedding_factory.get_embedder")
    @patch("rag_engine.vector_store.store_factory.get_vector_store")
    def test_ingestion_service_overwrite(
        self, mock_get_store, mock_get_emb, mock_pipeline_cls
    ):
        """IngestionService calls delete when overwrite=True"""
        mock_store = MagicMock()
        mock_store.policy_exists.return_value = True
        mock_get_store.return_value = mock_store

        mock_embedder = MagicMock()
        mock_embedder.embed_documents.return_value = [[0.1] * 768, [0.2] * 768]
        mock_get_emb.return_value = mock_embedder

        mock_pipeline = MagicMock()
        mock_pipeline.run.return_value = [
            ("chunk text 1", MagicMock(model_dump=lambda: {"policy_id": "POL-001"})),
            ("chunk text 2", MagicMock(model_dump=lambda: {"policy_id": "POL-001"})),
        ]
        mock_pipeline_cls.return_value = mock_pipeline

        from rag_engine.services.ingestion_service import IngestionService

        service = IngestionService()
        result = service.ingest("fake.pdf", "POL-001", overwrite=True)

        mock_store.delete_policy.assert_called_once_with("POL-001")
        mock_store.add_chunks.assert_called_once()
        assert result["status"] == "success"
        assert result["chunks"] == 2


# ====================================================================== #
#  TEST 7 — ResponseFormatter highlight fields
# ====================================================================== #
class TestResponseFormatterHighlightFields(unittest.TestCase):

    def test_sources_contain_page_number_and_highlight_text(self):
        """Sources must include page_number and highlight_text for PDF highlighting."""
        formatter = ResponseFormatter()
        mock_chunk = {
            "content": "The insured shall pay a deductible of $500.",
            "metadata": {
                "section_name": "Deductibles",
                "clause_type": "deductible",
                "policy_id": "POL-TEST",
                "page_number": 5,
            },
            "score": 0.90,
        }

        result = formatter.format_answer("Test answer", "test question", [mock_chunk])

        assert result["sources"][0]["page_number"] == 5
        assert result["sources"][0]["highlight_text"] == "The insured shall pay a deductible of $500."
        assert result["sources"][0]["snippet"] is not None


# ====================================================================== #
#  TEST 8 — DocumentCleaner.extract_page_map
# ====================================================================== #
class TestCleanerExtractPageMap(unittest.TestCase):

    def test_cleaner_extract_page_map(self):
        """extract_page_map should parse PAGE_START markers into a char-offset dict."""
        from rag_engine.ingestion.cleaner import DocumentCleaner

        raw_markdown = (
            "---PAGE_START:1---\n"
            "some text on page one\n"
            "\n"
            "---PAGE_START:3---\n"
            "more text on page three\n"
        )

        cleaner = DocumentCleaner()
        page_map = cleaner.extract_page_map(raw_markdown)

        assert len(page_map) > 0
        page_values = set(page_map.values())
        assert 1 in page_values
        assert 3 in page_values


if __name__ == "__main__":
    unittest.main()
