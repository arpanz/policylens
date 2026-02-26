"""Pydantic request / response models for the PolicyDecoder RAG API."""

from pydantic import BaseModel


# ------------------------------------------------------------------ #
#  Query
# ------------------------------------------------------------------ #
class QueryRequest(BaseModel):
    question: str
    policy_id: str
    k: int = 8


class QueryResponse(BaseModel):
    answer: str
    policy_id: str
    source_count: int
    sources: list[dict]
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
