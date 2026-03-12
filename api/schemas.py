"""Pydantic request / response models for the PolicyDecoder RAG API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ------------------------------------------------------------------ #
#  Query
# ------------------------------------------------------------------ #
class QueryRequest(BaseModel):
    question: str
    policy_id: str
    k: int = 8


class SourceItem(BaseModel):
    section: str
    clause_type: str
    page_number: Optional[int] = None
    highlight_text: Optional[str] = None
    relevance_score: float
    snippet: str


class QueryResponse(BaseModel):
    answer: str
    policy_id: str
    source_count: int
    sources: list[SourceItem]
    status: str = "success"


# ------------------------------------------------------------------ #
#  Ingest
# ------------------------------------------------------------------ #
class IngestRequest(BaseModel):
    policy_id: str
    pdf_url: str | None = None  # optional: download from URL
    overwrite: bool = False


class IngestResponse(BaseModel):
    status: str  # "success", "skipped", "processing"
    policy_id: str
    chunks: int = 0
    message: str = ""


# ------------------------------------------------------------------ #
#  Health
# ------------------------------------------------------------------ #
class HealthResponse(BaseModel):
    status: str
    version: str
    supabase_connected: bool
    model: str
