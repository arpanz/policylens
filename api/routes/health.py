"""Health router — quick liveness / readiness probe."""

from fastapi import APIRouter

from api.schemas import HealthResponse

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Return service health including Supabase connectivity."""
    from rag_engine.vector_store.store_factory import get_vector_store

    try:
        store = get_vector_store()
        store.policy_exists("health-check-ping")
        supabase_ok = True
    except Exception:
        supabase_ok = False

    return HealthResponse(
        status="ok" if supabase_ok else "degraded",
        version="1.0.0",
        supabase_connected=supabase_ok,
        model="BAAI/bge-base-en-v1.5 + kimi-k2.5",
    )
