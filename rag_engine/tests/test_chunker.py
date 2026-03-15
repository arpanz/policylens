"""Tests for ClauseChunker."""

from __future__ import annotations

import pytest

from rag_engine.chunking.clause_chunker import ClauseChunker
from rag_engine.schemas.chunk_metadata import ClauseType

SAMPLE_POLICY = """\
## SECTION 1 – DEFINITIONS
1.1 Insured means the person named in the Schedule.
1.2 Deductible means the first amount of any claim payable by the Insured.
## SECTION 2 – COVERAGE
2.1 We will pay for loss caused by fire, smoke, or explosion.
2.2 We will pay for theft subject to the deductible in Schedule A.
## SECTION 3 – EXCLUSIONS
3.1 This policy does not cover flood or surface water damage.
3.2 This policy does not cover earthquake or earth movement.
## SECTION 4 – SCHEDULE OF DEDUCTIBLES
| Event   | Deductible |
|---------|------------|
| Fire    | $500       |
| Theft   | $1,000     |
"""

POLICY_ID = "TEST-001"
SOURCE_FILE = "test_policy.pdf"


@pytest.fixture
def chunks():
    chunker = ClauseChunker()
    return chunker.chunk(SAMPLE_POLICY, policy_id=POLICY_ID, source_file=SOURCE_FILE)


def test_produces_chunks(chunks):
    assert len(chunks) > 0


def test_no_empty_chunks(chunks):
    for text, _meta in chunks:
        assert text.strip(), "Found an empty chunk"


def test_all_policy_ids_correct(chunks):
    for _text, meta in chunks:
        assert meta.policy_id == POLICY_ID


def test_exclusion_section_detected(chunks):
    clause_types = {meta.clause_type for _text, meta in chunks}
    assert ClauseType.EXCLUSION in clause_types


def test_coverage_section_detected(chunks):
    clause_types = {meta.clause_type for _text, meta in chunks}
    assert ClauseType.COVERAGE in clause_types


def test_table_chunk_detected(chunks):
    assert any(meta.table_chunk for _text, meta in chunks)


def test_deductible_flag(chunks):
    assert any(meta.deductible_related for _text, meta in chunks)


def test_token_counts_set(chunks):
    for _text, meta in chunks:
        assert meta.token_count > 0, f"Chunk {meta.chunk_index} has token_count=0"


def test_token_counts_within_limits(chunks):
    for _text, meta in chunks:
        assert meta.token_count <= 1024, (
            f"Chunk {meta.chunk_index} has {meta.token_count} tokens"
        )


def test_chunk_ids_unique(chunks):
    ids = [meta.chunk_id for _text, meta in chunks]
    assert len(ids) == len(set(ids)), "Duplicate chunk_id found"


def test_chunk_indices_sequential(chunks):
    indices = [meta.chunk_index for _text, meta in chunks]
    assert indices == list(range(len(indices))), (
        f"Expected sequential indices, got {indices}"
    )


# ====================================================================== #
#  Page-map aware chunking tests
# ====================================================================== #
class TestClauseChunkerPageMap:

    def test_chunk_uses_page_map_when_provided(self):
        """Chunks should have valid integer page numbers when page_map is given."""
        text = (
            "## SECTION 1 – DEFINITIONS\n"
            "1.1 Insured means the person named in the Schedule.\n"
            "1.2 Deductible means the first amount payable by the Insured.\n"
            "\n"
            "## SECTION 2 – EXCLUSIONS\n"
            "2.1 This policy does not cover flood damage.\n"
            "2.2 This policy does not cover earthquake.\n"
        )
        page_map = {0: 1, 500: 3}

        chunker = ClauseChunker()
        chunks = chunker.chunk(text, "TEST-001", "test.pdf", page_map=page_map)

        assert len(chunks) > 0
        for _text, meta in chunks:
            assert isinstance(meta.page_number, int)
            assert meta.page_number > 0

    def test_chunk_without_page_map_still_works(self):
        """Backward compatibility — chunk() without page_map returns valid results."""
        text = (
            "## SECTION 1 – COVERAGE\n"
            "We will pay for loss caused by fire or explosion.\n"
        )

        chunker = ClauseChunker()
        chunks = chunker.chunk(text, "TEST-002", "test.pdf")

        assert len(chunks) > 0
        for _text, meta in chunks:
            assert isinstance(meta.page_number, int)
            assert meta.page_number > 0
