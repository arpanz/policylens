"""PDF ingestion via pymupdf4llm — fast local PDF to markdown converter.

Replaces LlamaParse (slow cloud API, 60-120s) with pymupdf4llm (~0.2s local).
Output format is identical: PAGE_START markers preserved for chunker.

ROLLBACK: To revert to LlamaParse, set USE_LLAMAPARSE=true in HF secrets.
The original LlamaParse implementation is preserved below as commented code.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Union

from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)


class PDFLoader:
    """Loads a PDF document and returns raw markdown with PAGE_START markers."""

    def load(self, pdf_path: Union[str, Path]) -> str:
        """Parse a local PDF file and return its markdown representation.

        Returns:
            Raw markdown string with pages joined by PAGE_START separators.
            Format identical to LlamaParse output so chunker is unaffected.
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        if pdf_path.suffix.lower() != ".pdf":
            raise ValueError(f"Expected a .pdf file, got: {pdf_path.suffix}")

        # Check if LlamaParse fallback is requested via env var
        if os.getenv("USE_LLAMAPARSE", "false").lower() == "true":
            return self._load_with_llamaparse(pdf_path)

        return self._load_with_pymupdf(pdf_path)

    def _load_with_pymupdf(self, pdf_path: Path) -> str:
        """Fast local PDF parsing via pymupdf4llm (~0.2s)."""
        import pymupdf4llm
        import pymupdf

        doc = pymupdf.open(str(pdf_path))
        num_pages = len(doc)
        doc.close()

        parts = []
        for page_num in range(1, num_pages + 1):
            # Parse one page at a time to preserve page boundaries
            page_md = pymupdf4llm.to_markdown(
                str(pdf_path),
                pages=[page_num - 1],  # pymupdf uses 0-based page index
            )
            parts.append(f"---PAGE_START:{page_num}---\n{page_md}")

        raw_markdown = "\n\n".join(parts)

        logger.info(
            "pymupdf4llm parsed %d page(s) | %s chars",
            num_pages,
            f"{len(raw_markdown):,}",
        )

        return raw_markdown

    def load_from_bytes(
        self, pdf_bytes: bytes, filename: str = "document.pdf"
    ) -> str:
        """Write pdf_bytes to a temp file, parse it, then clean up."""
        import os
        import tempfile

        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
        try:
            with os.fdopen(tmp_fd, "wb") as f:
                f.write(pdf_bytes)
            return self.load(tmp_path)
        finally:
            os.unlink(tmp_path)
            logger.debug("Cleaned up temp file: %s", tmp_path)

    # ------------------------------------------------------------------
    # ROLLBACK FALLBACK — original LlamaParse implementation
    # Set USE_LLAMAPARSE=true in HF Space secrets to use this
    # ------------------------------------------------------------------
    def _load_with_llamaparse(self, pdf_path: Path) -> str:
        """Original LlamaParse cloud API implementation (60-120s)."""
        import nest_asyncio
        nest_asyncio.apply()

        from llama_parse import LlamaParse
        from rag_engine.config.settings import settings

        _PARSING_INSTRUCTION = (
            "This is an insurance policy document. When parsing:\n"
            " 1. Preserve ALL section headers and clause numbering exactly\n"
            "    (e.g. Section 3.1, Article IV, Clause (a)(ii)).\n"
            " 2. Convert all tables to Markdown pipe format. Every row on its own line.\n"
            "    Include header rows. Preserve separator rows.\n"
            " 3. Do NOT summarize, paraphrase, or omit any content.\n"
            " 4. Keep all monetary values, percentages, dates, and limits exact.\n"
            " 5. Preserve definition blocks exactly as written.\n"
            " 6. Keep ENDORSEMENTS sections clearly separated from main body.\n"
            " 7. Preserve ALL-CAPS headings as-is — they are legally significant."
        )

        parser = LlamaParse(
            api_key=settings.llama_cloud_api_key,
            result_type="markdown",
            language="en",
            num_workers=4,
            verbose=settings.debug,
            parsing_instruction=_PARSING_INSTRUCTION,
        )

        documents = parser.load_data(str(pdf_path))

        if not documents:
            raise ValueError(f"LlamaParse returned no pages for {pdf_path}")

        parts = []
        for page_num, doc in enumerate(documents, start=1):
            parts.append(f"---PAGE_START:{page_num}---\n{doc.text}")
        raw_markdown = "\n\n".join(parts)

        logger.info(
            "LlamaParse parsed %d page(s) | %s chars",
            len(documents),
            f"{len(raw_markdown):,}",
        )

        return raw_markdown
