"""Chunk metadata schema — stored as JSONB in supabase."""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class ClauseType(str, Enum):
    COVERAGE = "coverage"
    EXCLUSION = "exclusion"
    DEFINITION = "definition"
    DEDUCTIBLE = "deductible"
    LIMIT = "limit"
    ENDORSEMENT = "endorsement"
    SCHEDULE = "schedule"
    GENERAL_CONDITION = "general_condition"
    UNKNOWN = "unknown"


class ChunkMetadata(BaseModel):
    policy_id: str
    chunk_id: str = Field(default_factory=lambda: str(uuid4()))
    source_file: str
    section_name: str
    section_number: Optional[str] = None
    page_number: int = 1
    chunk_index: int = 0
    clause_type: ClauseType = ClauseType.UNKNOWN
    coverage_category: Optional[str] = None
    deductible_related: bool = False
    limit_related: bool = False
    endorsement_flag: bool = False
    table_chunk: bool = False
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    token_count: int = 0
    embedding_model_id: str = ""

    def to_supabase_dict(self) -> dict:
        """Flat dict for supabase JSONB. Replaces None w/ empty string,
        converts dates to isoformat, enums to .value."""
        raw = self.model_dump()
        out: dict = {}
        for key, value in raw.items():
            if value is None:
                out[key] = ""
            elif isinstance(value, date):
                out[key] = value.isoformat()
            elif isinstance(value, Enum):
                out[key] = value.value
            else:
                out[key] = value
        return out

    @classmethod
    def from_supabase_dict(cls, data: dict) -> ChunkMetadata:
        """Reverse of to_supabase_dict — rebuilds from JSONB dict."""
        cleaned: dict = dict(data)

        # empty strings back to None for optional fields
        for field_name in ("section_number", "coverage_category",
                           "effective_date", "expiry_date"):
            if cleaned.get(field_name) == "":
                cleaned[field_name] = None

        # parse date strings
        for date_field in ("effective_date", "expiry_date"):
            val = cleaned.get(date_field)
            if isinstance(val, str) and val:
                cleaned[date_field] = date.fromisoformat(val)

        ct = cleaned.get("clause_type")
        if isinstance(ct, str):
            cleaned["clause_type"] = ClauseType(ct)

        return cls(**cleaned)
