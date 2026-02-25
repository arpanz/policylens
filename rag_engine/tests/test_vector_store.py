"""Unit tests for SupabaseVectorStore — no real Supabase connection needed."""

import unittest
from unittest.mock import MagicMock, patch


class TestSupabaseVectorStore(unittest.TestCase):
    """Tests against a fully-mocked Supabase client."""

    def _make_store(self, mock_create_client: MagicMock):
        """Helper: build a SupabaseVectorStore with a mocked client."""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        # Patch settings so no real .env is needed
        with patch("rag_engine.vector_store.supabase_store.settings") as mock_settings:
            mock_settings.supabase_url = "https://fake.supabase.co"
            mock_settings.supabase_service_key = "fake-key"
            mock_settings.vector_table_name = "policy_chunks"

            from rag_engine.vector_store.supabase_store import SupabaseVectorStore

            store = SupabaseVectorStore()
        return store, mock_client

    # ------------------------------------------------------------------ #
    #  add_chunks
    # ------------------------------------------------------------------ #
    @patch("rag_engine.vector_store.supabase_store.create_client")
    def test_add_chunks_calls_insert(self, mock_create_client: MagicMock):
        store, mock_client = self._make_store(mock_create_client)

        chunks = [
            ("text1", [0.1] * 768, {"policy_id": "TEST-001"}),
            ("text2", [0.2] * 768, {"policy_id": "TEST-001"}),
            ("text3", [0.3] * 768, {"policy_id": "TEST-001"}),
        ]
        store.add_chunks(chunks)

        mock_client.table.assert_called()
        mock_client.table().insert.assert_called()
        mock_client.table().insert().execute.assert_called()

    # ------------------------------------------------------------------ #
    #  similarity_search — with results
    # ------------------------------------------------------------------ #
    @patch("rag_engine.vector_store.supabase_store.create_client")
    def test_similarity_search_returns_results(self, mock_create_client: MagicMock):
        store, mock_client = self._make_store(mock_create_client)

        mock_client.rpc.return_value.execute.return_value = MagicMock(
            data=[
                {"content": "flood excluded", "metadata": {"policy_id": "TEST"}, "similarity": 0.92},
                {"content": "fire covered", "metadata": {"policy_id": "TEST"}, "similarity": 0.85},
            ]
        )

        result = store.similarity_search([0.1] * 768, k=2)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["score"], 0.92)
        self.assertEqual(result[0]["content"], "flood excluded")

    # ------------------------------------------------------------------ #
    #  similarity_search — empty
    # ------------------------------------------------------------------ #
    @patch("rag_engine.vector_store.supabase_store.create_client")
    def test_similarity_search_empty(self, mock_create_client: MagicMock):
        store, mock_client = self._make_store(mock_create_client)

        mock_client.rpc.return_value.execute.return_value = MagicMock(data=[])

        result = store.similarity_search([0.1] * 768, k=5)
        self.assertEqual(result, [])

    # ------------------------------------------------------------------ #
    #  delete_policy
    # ------------------------------------------------------------------ #
    @patch("rag_engine.vector_store.supabase_store.create_client")
    def test_delete_policy_executes(self, mock_create_client: MagicMock):
        store, mock_client = self._make_store(mock_create_client)

        store.delete_policy("POL-001")

        mock_client.table().delete.assert_called()

    # ------------------------------------------------------------------ #
    #  policy_exists — true
    # ------------------------------------------------------------------ #
    @patch("rag_engine.vector_store.supabase_store.create_client")
    def test_policy_exists_true(self, mock_create_client: MagicMock):
        store, mock_client = self._make_store(mock_create_client)

        mock_response = MagicMock(count=5)
        mock_client.table().select().filter().execute.return_value = mock_response

        self.assertTrue(store.policy_exists("POL-001"))

    # ------------------------------------------------------------------ #
    #  policy_exists — false
    # ------------------------------------------------------------------ #
    @patch("rag_engine.vector_store.supabase_store.create_client")
    def test_policy_exists_false(self, mock_create_client: MagicMock):
        store, mock_client = self._make_store(mock_create_client)

        mock_response = MagicMock(count=0)
        mock_client.table().select().filter().execute.return_value = mock_response

        self.assertFalse(store.policy_exists("POL-001"))


if __name__ == "__main__":
    unittest.main()
