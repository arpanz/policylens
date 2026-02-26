"""Ingest router — trigger PDF ingestion (background) and check status."""

from fastapi import APIRouter, BackgroundTasks, HTTPException

from api.schemas import IngestRequest, IngestResponse

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["ingest"])


# ------------------------------------------------------------------ #
#  Background worker
# ------------------------------------------------------------------ #
def _run_ingestion(policy_id: str, pdf_path: str, overwrite: bool) -> None:
    """Run ingestion synchronously inside a background thread."""
    from rag_engine.services.ingestion_service import IngestionService

    service = IngestionService()
    result = service.ingest(pdf_path, policy_id, overwrite=overwrite)
    logger.info("Background ingestion complete: %s", result)


# ------------------------------------------------------------------ #
#  POST /ingest/
# ------------------------------------------------------------------ #
@router.post("/", response_model=IngestResponse)
async def ingest_policy(body: IngestRequest, background_tasks: BackgroundTasks):
    """Kick off ingestion in the background and return immediately."""
    if body.pdf_url is None:
        raise HTTPException(
            status_code=400,
            detail="pdf_url is required. File upload endpoint coming soon.",
        )

    background_tasks.add_task(
        _run_ingestion, body.policy_id, body.pdf_url, body.overwrite
    )

    return IngestResponse(
        status="processing",
        policy_id=body.policy_id,
        message="Ingestion started in background. Poll /ingest/status/{policy_id}",
    )


# ------------------------------------------------------------------ #
#  GET /ingest/status/{policy_id}
# ------------------------------------------------------------------ #
@router.get("/status/{policy_id}")
async def ingest_status(policy_id: str):
    """Check whether a policy has been ingested and how many chunks it has."""
    from rag_engine.vector_store.store_factory import get_vector_store

    store = get_vector_store()
    exists = store.policy_exists(policy_id)
    count = store.get_policy_chunk_count(policy_id) if exists else 0

    return {
        "policy_id": policy_id,
        "ingested": exists,
        "chunk_count": count,
        "status": "ready" if exists else "not_found",
    }
