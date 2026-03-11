"""Token counting + splitting utils using tiktoken cl100k_base."""

from __future__ import annotations

from functools import lru_cache
from typing import List

import tiktoken


@lru_cache(maxsize=1)
def _get_encoder() -> tiktoken.Encoding:
    return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_get_encoder().encode(text))


def truncate_to_tokens(text: str, max_tokens: int) -> str:
    encoder = _get_encoder()
    tokens = encoder.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return encoder.decode(tokens[:max_tokens])


def split_text_by_tokens(
    text: str,
    max_tokens: int,
    overlap_tokens: int = 0,
) -> List[str]:
    encoder = _get_encoder()
    tokens = encoder.encode(text)

    if len(tokens) <= max_tokens:
        return [text]

    step = max(1, max_tokens - overlap_tokens)
    chunks: List[str] = []

    for start in range(0, len(tokens), step):
        chunk_tokens = tokens[start : start + max_tokens]
        chunks.append(encoder.decode(chunk_tokens))
        if start + max_tokens >= len(tokens):
            break

    return chunks
