"""PDF ingestion via LlamaParse — converts policy PDFs to markdown."""

import nest_asyncio

nest_asyncio.apply()

import os
import tempfile
from pathlib import Path
from typing import Union

from llama_parse import LlamaParse

from rag_engine.config.settings import settings
from rag_engine.utils.logger import get_logger
from rag_engine.utils.retry import with_retry

logger = get_logger(__name__)

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



class PDFLoader:
    """Loads a PDF document via LlamaParse and returns raw markdown."""

    def __init__(self) -> None:
        self._parser = LlamaParse(
            api_key=settings.llama_cloud_api_key,
            result_type="markdown",
            language="en",
            num_workers=4,
            verbose=settings.debug,
            parsing_instruction=_PARSING_INSTRUCTION,
            fast_mode=True
        )

    @with_retry(max_retries=3, delay=2.0, backoff=2.0)
    def load(self, pdf_path: Union[str, Path]) -> str:
        """Parse a local PDF file and return its markdown representation.

        Args:
            pdf_path: Path to the PDF file on disk.

        Returns:
            Raw markdown string with pages joined by PAGE_BREAK separators.

        Raises:
            FileNotFoundError: If *pdf_path* does not exist.
            ValueError: If the file is not a ``.pdf`` or parsing yields no pages.
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        if pdf_path.suffix.lower() != ".pdf":
            raise ValueError(f"Expected a .pdf file, got: {pdf_path.suffix}")

        documents = self._parser.load_data(str(pdf_path))

        if not documents:
            raise ValueError(f"LlamaParse returned no pages for {pdf_path}")

        # Embed real page numbers as markers so chunker can assign accurate page_number to each chunk
        parts = []
        for page_num, doc in enumerate(documents, start=1):
            parts.append(f"---PAGE_START:{page_num}---\n{doc.text}")
        raw_markdown = "\n\n".join(parts)

        logger.info(
            "Parsed %d page(s) | %s chars",
            len(documents),
            f"{len(raw_markdown):,}",
        )

        return raw_markdown

    def load_from_bytes(
        self, pdf_bytes: bytes, filename: str = "document.pdf"
    ) -> str:
        """Write *pdf_bytes* to a temp file, parse it, then clean up.

        Args:
            pdf_bytes: Raw PDF content.
            filename: Name used for the temporary file (default ``document.pdf``).

        Returns:
            Raw markdown string (same as :meth:`load`).
        """
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
        try:
            with os.fdopen(tmp_fd, "wb") as f:
                f.write(pdf_bytes)
            return self.load(tmp_path)
        finally:
            os.unlink(tmp_path)
            logger.debug("Cleaned up temp file: %s", tmp_path)
