"""Post-parse document cleaner — strips noise from raw markdown."""

import re

from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

# Patterns that identify header / footer / separator lines to remove.
_REMOVE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^Page\s+\d+\s+of\s+\d+$"),
    re.compile(r"^\d+\s*$"),
    re.compile(r"^Confidential\s*$", re.IGNORECASE),
    re.compile(r"^CONFIDENTIAL\s*$"),
    re.compile(r"^www\.\S+\.\S+$"),
    re.compile(r"^©.*\d{4}.*$"),
    re.compile(r"^---PAGE_START:\d+---$"),
    re.compile(r"^---PAGE_BREAK---$"),
    re.compile(r"^_{3,}$"),
    re.compile(r"^\*{3,}$"),
]

# Matches headings like SECTION 1, PART IV, ARTICLE 2, CHAPTER IX …
_HEADING_RE = re.compile(
    r"^(SECTION|PART|ARTICLE|CHAPTER)\s+[IVX\d]+", re.IGNORECASE
)

_PAGE_MARKER_RE = re.compile(r"^---PAGE_START:(\d+)---$")


class DocumentCleaner:
    """Cleans raw markdown produced by the PDF parser."""

    def extract_page_map(self, raw_markdown: str) -> dict[int, int]:
        """Returns a mapping of character offset → page number, built from
        PAGE_START markers embedded by PDFLoader.

        Must be called on raw_markdown BEFORE clean() strips the markers.
        """
        page_map: dict[int, int] = {}
        current_page = 1
        offset = 0

        for line in raw_markdown.splitlines(keepends=True):
            match = _PAGE_MARKER_RE.match(line.strip())
            if match:
                current_page = int(match.group(1))
            else:
                page_map[offset] = current_page
            offset += len(line)

        return page_map

    def clean(self, raw_markdown: str) -> str:
        """Run the full cleaning pipeline and return the result.

        Applies, in order:
        1. Header / footer removal
        2. Hyphenation fix
        3. Whitespace normalisation
        4. Section-heading normalisation
        """
        result = raw_markdown
        result = self._remove_headers_footers(result)
        result = self._fix_hyphenation(result)
        result = self._normalize_whitespace(result)
        result = self._normalize_section_headings(result)

        logger.info(
            "Cleaner: %s → %s chars",
            f"{len(raw_markdown):,}",
            f"{len(result):,}",
        )
        return result

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _remove_headers_footers(text: str) -> str:
        """Filter out lines that match known header/footer/separator patterns."""
        cleaned_lines: list[str] = []
        for line in text.splitlines():
            stripped = line.strip()
            if any(pat.match(stripped) for pat in _REMOVE_PATTERNS):
                continue
            cleaned_lines.append(line)
        return "\n".join(cleaned_lines)

    @staticmethod
    def _fix_hyphenation(text: str) -> str:
        """Re-join words split across lines by a hyphen."""
        return re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)

    @staticmethod
    def _normalize_whitespace(text: str) -> str:
        """Collapse runs of 3+ newlines into exactly 2; strip trailing spaces."""
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = "\n".join(line.rstrip() for line in text.splitlines())
        return text.strip()

    @staticmethod
    def _normalize_section_headings(text: str) -> str:
        """Prepend ``## `` to bare section/part/article/chapter headings."""
        out_lines: list[str] = []
        for line in text.splitlines():
            if _HEADING_RE.match(line.strip()) and not line.lstrip().startswith("#"):
                out_lines.append(f"## {line.strip()}")
            else:
                out_lines.append(line)
        return "\n".join(out_lines)
