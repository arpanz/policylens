"""Clause-aware chunker for insurance policy docs."""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

from rag_engine.chunking.base_chunker import BaseChunker
from rag_engine.chunking.table_chunker import TableChunker
from rag_engine.chunking.token_utils import count_tokens, split_text_by_tokens
from rag_engine.config.constants import (
    CHUNK_TOKEN_SIZES,
    CLAUSE_PATTERNS,
    CLAUSE_TYPE_KEYWORDS,
    COVERAGE_CATEGORIES,
    SECTION_PATTERNS,
)
from rag_engine.schemas.chunk_metadata import ChunkMetadata, ClauseType
from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

# strip inline (?i) flags from patterns — we pass re.IGNORECASE to compile instead
_clean_section_patterns = [p.replace("(?i)", "") for p in SECTION_PATTERNS]
_SECTION_RE = re.compile(
    r"(?:^|\n)(?=" + "|".join(_clean_section_patterns) + r")|(?:^|\n)(?=## )",
    re.MULTILINE | re.IGNORECASE,
)

_CLAUSE_RE = re.compile(
    r"(?:^|\n)(?=" + "|".join(CLAUSE_PATTERNS) + r")",
    re.MULTILINE,
)

_TABLE_HEAVY_THRESHOLD = 0.30
_OVERLAP_LINES = 3


class ClauseChunker(BaseChunker):

    def __init__(self) -> None:
        self._table_chunker = TableChunker()

    def chunk(
        self,
        text: str,
        policy_id: str,
        source_file: str,
        page_map: dict | None = None,
    ) -> List[Tuple[str, ChunkMetadata]]:
        sections = self._split_into_sections(text)
        results: List[Tuple[str, ChunkMetadata]] = []
        current_page = 1
        global_chunk_idx = 0

        for section_name, section_text, section_number in sections:
            section_text = section_text.strip()
            if not section_text:
                continue

            # table-heavy sections go to TableChunker
            if self._is_table_heavy(section_text):
                table_chunks = self._table_chunker.chunk_table(
                    text=section_text,
                    policy_id=policy_id,
                    source_file=source_file,
                    section_name=section_name,
                    section_number=section_number,
                    page_number=current_page,
                    base_chunk_index=global_chunk_idx,
                )
                results.extend(table_chunks)
                global_chunk_idx += len(table_chunks)
                current_page = self._resolve_page(text, section_text, page_map, current_page)
                continue

            clause_type = self._detect_clause_type(section_name, section_text)
            cfg = CHUNK_TOKEN_SIZES.get(
                clause_type.value, CHUNK_TOKEN_SIZES["unknown"]
            )
            max_tokens: int = cfg["max"]
            overlap: int = cfg["overlap"]

            token_count = count_tokens(section_text)

            if token_count <= max_tokens:
                meta = self._build_metadata(
                    policy_id=policy_id,
                    source_file=source_file,
                    section_name=section_name,
                    section_number=section_number,
                    page_number=current_page,
                    chunk_index=global_chunk_idx,
                    clause_type=clause_type,
                    text=section_text,
                    token_count=token_count,
                )
                results.append((section_text, meta))
                global_chunk_idx += 1
            else:
                sub_chunks = self._split_at_clause_boundaries(
                    section_text, max_tokens, overlap,
                )
                for sub_text in sub_chunks:
                    sub_tokens = count_tokens(sub_text)
                    meta = self._build_metadata(
                        policy_id=policy_id,
                        source_file=source_file,
                        section_name=section_name,
                        section_number=section_number,
                        page_number=current_page,
                        chunk_index=global_chunk_idx,
                        clause_type=clause_type,
                        text=sub_text,
                        token_count=sub_tokens,
                    )
                    results.append((sub_text, meta))
                    global_chunk_idx += 1

            current_page = self._resolve_page(text, section_text, page_map, current_page)

        return results

    @staticmethod
    def _split_into_sections(
        text: str,
    ) -> List[Tuple[str, str, Optional[str]]]:
        parts = _SECTION_RE.split(text)
        sections: List[Tuple[str, str, Optional[str]]] = []

        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue

            first_line, _, rest = part.partition("\n")
            first_line_stripped = first_line.strip()

            section_name = "Preamble"
            section_number: Optional[str] = None

            if first_line_stripped.startswith("## "):
                section_name = first_line_stripped.lstrip("# ").strip()
                part = rest.strip() if rest.strip() else first_line_stripped
            else:
                for pattern in SECTION_PATTERNS:
                    match = re.match(pattern, first_line_stripped)
                    if match:
                        section_name = first_line_stripped
                        section_number = match.group(0).strip()
                        part = rest.strip() if rest.strip() else first_line_stripped
                        break
                else:
                    if i > 0:
                        section_name = first_line_stripped[:80]

            sections.append((section_name, part, section_number))

        if not sections:
            sections.append(("Preamble", text.strip(), None))

        return sections

    @staticmethod
    def _split_at_clause_boundaries(
        text: str,
        max_tokens: int,
        overlap_tokens: int,
    ) -> List[str]:
        parts = _CLAUSE_RE.split(text)
        parts = [p.strip() for p in parts if p.strip()]

        if len(parts) <= 1:
            return split_text_by_tokens(text, max_tokens, overlap_tokens)

        chunks: List[str] = []
        current_parts: List[str] = []
        current_tokens = 0

        for part in parts:
            part_tokens = count_tokens(part)

            if current_parts and (current_tokens + part_tokens) > max_tokens:
                chunk_text = "\n".join(current_parts)
                chunks.append(chunk_text)

                # 3-line overlap for context continuity
                overlap_lines = "\n".join(current_parts).splitlines()[-_OVERLAP_LINES:]
                current_parts = ["\n".join(overlap_lines)]
                current_tokens = count_tokens(current_parts[0])

            current_parts.append(part)
            current_tokens += part_tokens

        if current_parts:
            chunks.append("\n".join(current_parts))

        # safety net — if any chunk still too big, split by tokens
        final: List[str] = []
        for chunk in chunks:
            if count_tokens(chunk) > max_tokens:
                final.extend(
                    split_text_by_tokens(chunk, max_tokens, overlap_tokens)
                )
            else:
                final.append(chunk)

        return final

    @staticmethod
    def _detect_clause_type(section_name: str, text: str) -> ClauseType:
        """Two-pass detection: check heading first (stronger signal),
        then body text. Exclusion checked before coverage to avoid
        misstagging exclusion sections that mention 'cover'."""
        heading = section_name.lower()
        body_snippet = text[:600].lower()

        # priority order matters here — dont change without thinking
        ordered_types = [
            "exclusion",
            "definition",
            "deductible",
            "schedule",
            "endorsement",
            "limit",
            "coverage",
            "general_condition",
        ]

        # pass 1: heading
        for clause_key in ordered_types:
            keywords = CLAUSE_TYPE_KEYWORDS.get(clause_key, [])
            for kw in keywords:
                if kw in heading:
                    return ClauseType(clause_key)

        # pass 2: body
        for clause_key in ordered_types:
            keywords = CLAUSE_TYPE_KEYWORDS.get(clause_key, [])
            for kw in keywords:
                if kw in body_snippet:
                    return ClauseType(clause_key)

        return ClauseType.UNKNOWN

    @staticmethod
    def _detect_coverage_category(text: str) -> Optional[str]:
        text_lower = text.lower()
        for category, keywords in COVERAGE_CATEGORIES.items():
            for kw in keywords:
                if kw in text_lower:
                    return category
        return None

    @staticmethod
    def _is_table_heavy(text: str) -> bool:
        """30%+ lines with pipes = table-heavy section."""
        lines = text.strip().splitlines()
        if not lines:
            return False
        pipe_lines = sum(1 for line in lines if "|" in line)
        return (pipe_lines / len(lines)) >= _TABLE_HEAVY_THRESHOLD

    @classmethod
    def _build_metadata(
        cls,
        *,
        policy_id: str,
        source_file: str,
        section_name: str,
        section_number: Optional[str],
        page_number: int,
        chunk_index: int,
        clause_type: ClauseType,
        text: str,
        token_count: int,
    ) -> ChunkMetadata:
        text_lower = text.lower()

        return ChunkMetadata(
            policy_id=policy_id,
            source_file=source_file,
            section_name=section_name,
            section_number=section_number,
            page_number=page_number,
            chunk_index=chunk_index,
            clause_type=clause_type,
            coverage_category=cls._detect_coverage_category(text),
            deductible_related=any(
                kw in text_lower
                for kw in ("deductible", "excess", "retention")
            ),
            limit_related=any(
                kw in text_lower
                for kw in ("limit", "maximum", "sum insured", "aggregate")
            ),
            endorsement_flag=(clause_type == ClauseType.ENDORSEMENT),
            table_chunk=False,
            token_count=token_count,
        )

    @staticmethod
    def _estimate_page(current_page: int, text: str) -> int:
        # rough estimate ~3000 chars per page
        return current_page + max(1, len(text) // 3000)

    @staticmethod
    def _resolve_page(
        full_text: str,
        section_text: str,
        page_map: dict | None,
        fallback: int,
    ) -> int:
        # Use real page_map if available (ingestion path), fall back to estimate for dry-run/test mode
        if not page_map:
            return fallback + max(1, len(section_text) // 3000)

        offset = full_text.find(section_text[:80])
        if offset == -1:
            return fallback

        candidates = [k for k in page_map if k <= offset]
        if not candidates:
            return fallback

        return page_map[max(candidates)]
