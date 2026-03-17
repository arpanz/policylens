"""Orchestrates full pipeline: PDF → Parse → Clean → Chunk → Embed → Store in Supabase.

This is the entry point for ingesting a new policy document.
"""

from __future__ import annotations

from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)


class IngestionService:
    """End-to-end ingestion: PDF → parse → clean → chunk → embed → Supabase."""

    def __init__(self) -> None:
        from rag_engine.embeddings.embedding_factory import get_embedder
        from rag_engine.ingestion.pipeline import IngestionPipeline
        from rag_engine.vector_store.store_factory import get_vector_store

        self._pipeline = IngestionPipeline()
        self._embedder = get_embedder()
        self._store = get_vector_store()
        logger.info("IngestionService initialized")

    # ------------------------------------------------------------------ #
    #  ingest
    # ------------------------------------------------------------------ #
    def ingest(
        self,
        pdf_path: str,
        policy_id: str,
        overwrite: bool = False,
    ) -> dict:
        """Ingest a policy PDF into the vector store.

        Returns a status dict with ``status``, ``policy_id``, ``chunks``,
        and additional metadata.
        """
        logger.info(
            "IngestionService.ingest START | policy_id=%s", policy_id
        )

        from rag_engine.utils.status_tracker import status_tracker
        status_tracker.update_status(policy_id, "processing", 5, "Initializing ingestion...")

        # Step 1 — check if already exists
        if self._store.policy_exists(policy_id) and not overwrite:
            count = self._store.get_policy_chunk_count(policy_id)
            logger.info(
                "Policy %s already ingested (%d chunks). Skipping.",
                policy_id,
                count,
            )
            status_tracker.update_status(policy_id, "ready", 100, "Already ingested")
            return {
                "status": "skipped",
                "policy_id": policy_id,
                "chunks": count,
                "reason": "already_exists",
            }

        # Step 2 — delete existing if overwrite
        if overwrite and self._store.policy_exists(policy_id):
            self._store.delete_policy(policy_id)
            logger.info("Deleted existing chunks for %s", policy_id)
            status_tracker.update_status(policy_id, "processing", 10, "Cleared existing data")

        # Step 3 — parse + chunk
        status_tracker.update_status(policy_id, "processing", 15, "Parsing PDF...")
        chunks = self._pipeline.run(pdf_path, policy_id)
        logger.info("Pipeline produced %d chunks", len(chunks))
        status_tracker.update_status(policy_id, "processing", 60, f"Parsed {len(chunks)} chunks")

        # Step 4 — embed all chunks
        texts = [text for text, _ in chunks]
        metadatas = [
            meta.to_supabase_dict() if hasattr(meta, "to_supabase_dict") else meta.model_dump()
            for _, meta in chunks
        ]
        logger.info("Embedding %d chunks...", len(texts))
        status_tracker.update_status(policy_id, "processing", 65, "Generating embeddings...")
        embeddings = self._embedder.embed_documents(texts)
        logger.info("Embedding complete")
        status_tracker.update_status(policy_id, "processing", 85, "Embeddings generated")

        # Step 5 — store in Supabase
        status_tracker.update_status(policy_id, "processing", 90, "Storing chunks in Supabase...")
        store_tuples = list(zip(texts, embeddings, metadatas))
        self._store.add_chunks(store_tuples)

        logger.info(
            "IngestionService.ingest COMPLETE | policy_id=%s | chunks=%d",
            policy_id,
            len(chunks),
        )

        # ✅ Set ready IMMEDIATELY after chunks stored — don't wait for summary
        status_tracker.update_status(policy_id, "ready", 100, "Ready")

        return {
            "status": "success",
            "policy_id": policy_id,
            "chunks": len(chunks),
            "embedding_dim": len(embeddings[0]) if embeddings else 0,
        }
