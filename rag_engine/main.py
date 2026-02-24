"""CLI entry-point for the RAG ingestion pipeline.

Usage:
    python rag_engine/main.py --dry-run
    python rag_engine/main.py --pdf path/to/policy.pdf --policy-id POL-001
"""

from __future__ import annotations

import argparse
import collections
import sys
from pathlib import Path
from typing import List, Tuple

from rag_engine.chunking.clause_chunker import ClauseChunker
from rag_engine.ingestion.cleaner import DocumentCleaner
from rag_engine.schemas.chunk_metadata import ChunkMetadata
from rag_engine.utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Hardcoded sample for --dry-run (no LlamaParse API call required)
# ---------------------------------------------------------------------------
_DRY_RUN_SAMPLE = """\
## SECTION 1 - DEFINITIONS
1.1 Insured means the person named in the Schedule.
1.2 Deductible means the first amount of any claim payable.

## SECTION 2 - COVERAGE
2.1 We will pay for loss caused by fire, smoke, or explosion.
2.2 We will pay for theft subject to the deductible in Schedule A.

## SECTION 3 - EXCLUSIONS
3.1 This policy does not cover flood or surface water damage.
3.2 This policy does not cover earthquake or earth movement.

## SECTION 4 - SCHEDULE OF DEDUCTIBLES
| Event  | Deductible |
|--------|------------|
| Fire   | $500       |
| Theft  | $1,000     |
"""


# ---------------------------------------------------------------------------
# Result printer
# ---------------------------------------------------------------------------
def _print_results(
    policy_id: str,
    chunks: List[Tuple[str, ChunkMetadata]],
) -> None:
    """Pretty-print chunk summary to stdout."""
    print(f"\n{'=' * 60}")
    print(f"  Policy: {policy_id}  |  Total chunks: {len(chunks)}")
    print(f"{'=' * 60}")

    # Clause-type distribution
    counter = collections.Counter(meta.clause_type.value for _, meta in chunks)
    print("\nClause-type distribution:")
    for ctype, count in counter.most_common():
        print(f"  {ctype:<20s} {count}")

    # First 5 chunks
    print(f"\n{'—' * 60}")
    for text, meta in chunks[:5]:
        preview = text[:200].replace("\n", " ")
        print(
            f"  [{meta.chunk_index}] section={meta.section_name!r}\n"
            f"      clause_type={meta.clause_type.value}  "
            f"coverage_category={meta.coverage_category}\n"
            f"      tokens={meta.token_count}  "
            f"deductible_related={meta.deductible_related}  "
            f"limit_related={meta.limit_related}  "
            f"table_chunk={meta.table_chunk}\n"
            f"      text={preview!r}\n"
        )

    if len(chunks) > 5:
        print(f"  ... and {len(chunks) - 5} more chunks\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="RAG Engine — ingestion pipeline CLI",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run cleaner + chunker on a hardcoded sample (no LlamaParse call).",
    )
    parser.add_argument(
        "--pdf",
        type=str,
        default=None,
        help="Path to a PDF file to ingest.",
    )
    parser.add_argument(
        "--policy-id",
        type=str,
        default=None,
        help="Policy identifier (required with --pdf).",
    )
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    if args.dry_run:
        logger.info("=== DRY-RUN MODE ===")
        cleaner = DocumentCleaner()
        chunker = ClauseChunker()

        clean_text = cleaner.clean(_DRY_RUN_SAMPLE)
        chunks = chunker.chunk(clean_text, "DRY-RUN-001", "dry_run_sample.md")

        _print_results(policy_id="DRY-RUN-001", chunks=chunks)

    elif args.pdf:
        if not args.policy_id:
            parser.error("--policy-id is required when using --pdf")

        from rag_engine.ingestion.pipeline import IngestionPipeline

        pipeline = IngestionPipeline()
        chunks = pipeline.run(pdf_path=args.pdf, policy_id=args.policy_id)

        _print_results(policy_id=args.policy_id, chunks=chunks)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
