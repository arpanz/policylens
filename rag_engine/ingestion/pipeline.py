"""Orchestrates PDF → Parse → Clean → Chunk.

Returns chunks ready for Phase 2 embedding.
Does NOT embed. Does NOT call Supabase.
"""

from __future__ import annotations

from pathlib import Path
from typing import List, Tuple, Union

from rag_engine.chunking.clause_chunker import ClauseChunker
from rag_engine.ingestion.cleaner import DocumentCleaner
from rag_engine.ingestion.pdf_loader import PDFLoader
from rag_engine.schemas.chunk_metadata import ChunkMetadata
from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)


class IngestionPipeline:
    """Full ingestion pipeline: PDF → parse → clean → clause-chunk."""

    def __init__(self) -> None:
        self.loader = PDFLoader()
        self.cleaner = DocumentCleaner()
        self.chunker = ClauseChunker()

    def run(
        self,
        pdf_path: Union[str, Path],
        policy_id: str,
    ) -> List[Tuple[str, ChunkMetadata]]:
        """Execute the end-to-end ingestion pipeline.

        Args:
            pdf_path: Path to the source PDF.
            policy_id: Unique identifier for the policy being ingested.

        Returns:
            List of ``(chunk_text, ChunkMetadata)`` tuples ready for embedding.
        """
        pdf_path = Path(pdf_path)
        logger.info(
            "IngestionPipeline.run | policy_id=%s | file=%s",
            policy_id,
            pdf_path.name,
        )

        # Step 1 — parse PDF to markdown
        raw_markdown = self.loader.load(pdf_path)
        logger.info("Parse complete | %s chars", f"{len(raw_markdown):,}")

        # Extract real page numbers BEFORE clean() strips the PAGE_START markers
        page_map = self.cleaner.extract_page_map(raw_markdown)
        logger.info("Page map built | %d page boundaries tracked", len(set(page_map.values())))

        # Step 2 — clean markdown
        clean_text = self.cleaner.clean(raw_markdown)
        logger.info("Clean complete | %s chars", f"{len(clean_text):,}")

        # Step 3 — clause-aware chunking
        chunks = self.chunker.chunk(clean_text, policy_id, pdf_path.name, page_map=page_map)
        logger.info("Chunking complete | %d chunks produced", len(chunks))

        return chunks
