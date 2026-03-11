"""Chunker for markdown tables in policy schedules."""

from __future__ import annotations

from typing import List, Optional, Tuple

from rag_engine.chunking.token_utils import count_tokens
from rag_engine.schemas.chunk_metadata import ChunkMetadata, ClauseType
from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

MAX_TABLE_TOKENS: int = 1024

_DEDUCTIBLE_KEYWORDS = {"deductible", "excess", "retention", "self-insured"}
_LIMIT_KEYWORDS = {"limit", "maximum", "sum insured", "aggregate", "sub-limit", "cap"}


class TableChunker:

    def chunk_table(
        self,
        text: str,
        policy_id: str,
        source_file: str,
        section_name: str = "Table",
        section_number: Optional[str] = None,
        page_number: int = 1,
        base_chunk_index: int = 0,
    ) -> List[Tuple[str, ChunkMetadata]]:
        lines = text.strip().splitlines()

        # find header + separator rows
        header_idx: Optional[int] = None
        separator_idx: Optional[int] = None

        for i, line in enumerate(lines):
            stripped = line.strip()
            if "|" in stripped and header_idx is None:
                header_idx = i
            elif header_idx is not None and separator_idx is None:
                if set(stripped.replace("|", "").strip()) <= {"-", " ", ":"}:
                    separator_idx = i
                    break

        # no table found, just return the whole thing as one chunk
        if header_idx is None or separator_idx is None:
            logger.debug("No markdown table found — single chunk fallback.")
            return self._single_chunk(
                text, policy_id, source_file, section_name,
                section_number, page_number, base_chunk_index,
            )

        preamble_lines = lines[:header_idx]
        header_line = lines[header_idx]
        separator_line = lines[separator_idx]
        data_lines = lines[separator_idx + 1:]

        preamble = "\n".join(preamble_lines).strip()
        header_block = f"{header_line}\n{separator_line}"

        # group data rows into batches that fit under MAX_TABLE_TOKENS
        batches: List[List[str]] = []
        current_batch: List[str] = []
        current_tokens = count_tokens(header_block) + (
            count_tokens(preamble) if preamble else 0
        )

        for row in data_lines:
            row_stripped = row.strip()
            if not row_stripped:
                continue
            row_tokens = count_tokens(row_stripped)
            if current_batch and (current_tokens + row_tokens) > MAX_TABLE_TOKENS:
                batches.append(current_batch)
                current_batch = []
                current_tokens = count_tokens(header_block) + (
                    count_tokens(preamble) if preamble else 0
                )
            current_batch.append(row_stripped)
            current_tokens += row_tokens

        if current_batch:
            batches.append(current_batch)

        if not batches:
            return self._single_chunk(
                text, policy_id, source_file, section_name,
                section_number, page_number, base_chunk_index,
            )

        # build chunks — header re-included in every split
        text_lower = text.lower()
        deductible_related = any(kw in text_lower for kw in _DEDUCTIBLE_KEYWORDS)
        limit_related = any(kw in text_lower for kw in _LIMIT_KEYWORDS)

        results: List[Tuple[str, ChunkMetadata]] = []
        for batch_idx, batch_rows in enumerate(batches):
            parts = []
            if preamble:
                parts.append(preamble)
            parts.append(header_block)
            parts.extend(batch_rows)
            chunk_text = "\n".join(parts)

            meta = ChunkMetadata(
                policy_id=policy_id,
                source_file=source_file,
                section_name=section_name,
                section_number=section_number,
                page_number=page_number,
                chunk_index=base_chunk_index + batch_idx,
                clause_type=ClauseType.SCHEDULE,
                table_chunk=True,
                deductible_related=deductible_related,
                limit_related=limit_related,
                token_count=count_tokens(chunk_text),
            )
            results.append((chunk_text, meta))

        return results

    @staticmethod
    def _single_chunk(
        text: str,
        policy_id: str,
        source_file: str,
        section_name: str,
        section_number: Optional[str],
        page_number: int,
        chunk_index: int,
    ) -> List[Tuple[str, ChunkMetadata]]:
        text_lower = text.lower()
        meta = ChunkMetadata(
            policy_id=policy_id,
            source_file=source_file,
            section_name=section_name,
            section_number=section_number,
            page_number=page_number,
            chunk_index=chunk_index,
            clause_type=ClauseType.SCHEDULE,
            table_chunk=True,
            deductible_related=any(kw in text_lower for kw in _DEDUCTIBLE_KEYWORDS),
            limit_related=any(kw in text_lower for kw in _LIMIT_KEYWORDS),
            token_count=count_tokens(text),
        )
        return [(text, meta)]
