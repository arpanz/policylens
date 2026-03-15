"""Ingest router — trigger PDF ingestion (background) and check status."""

import os
import shutil
import tempfile

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, UploadFile

from api.schemas import IngestRequest, IngestResponse, PolicySummaryResponse

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["ingest"])


# ------------------------------------------------------------------ #
#  Background workers
# ------------------------------------------------------------------ #
def _run_ingestion(policy_id: str, pdf_path: str, overwrite: bool) -> None:
    """Run ingestion synchronously inside a background thread (URL mode)."""
    from rag_engine.services.ingestion_service import IngestionService

    service = IngestionService()
    result = service.ingest(pdf_path, policy_id, overwrite=overwrite)
    logger.info("Background ingestion complete: %s", result)

    # Auto-generate summary after successful ingestion
    if result.get("status") == "success":
        _auto_generate_summary(policy_id)


def _run_ingestion_from_file(policy_id: str, tmp_path: str, overwrite: bool) -> None:
    """Run ingestion from a temp file and always clean up afterwards."""
    try:
        from rag_engine.services.ingestion_service import IngestionService

        service = IngestionService()
        result = service.ingest(tmp_path, policy_id, overwrite=overwrite)
        logger.info("File ingestion complete | policy_id=%s | result=%s", policy_id, result)

        # Auto-generate summary after successful ingestion
        if result.get("status") == "success":
            _auto_generate_summary(policy_id)
    except Exception as e:
        logger.error("File ingestion failed | policy_id=%s | error=%s", policy_id, e)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _auto_generate_summary(policy_id: str) -> None:
    """Generate and store a policy summary. Failures are logged, not raised."""
    try:
        from rag_engine.services.summary_service import SummaryService

        svc = SummaryService()
        summary = svc.generate(policy_id)
        if "error" not in summary:
            svc.store(policy_id, summary)
            logger.info("Auto-generated summary for policy_id=%s", policy_id)
        else:
            logger.warning("Summary generation returned error for policy_id=%s: %s", policy_id, summary)
    except Exception as e:
        logger.error("Auto-summary failed for policy_id=%s: %s", policy_id, e)


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


# ------------------------------------------------------------------ #
#  POST /ingest/upload  (multipart file upload)
# ------------------------------------------------------------------ #
@router.post("/upload", response_model=IngestResponse)
async def ingest_upload(
    file: UploadFile,
    policy_id: str = Form(...),
    overwrite: bool = Form(False),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Upload a PDF file and ingest it in the background."""
    # a) Validate file type
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    # b) Save to temp directory
    suffix = f"_{file.filename}"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    # c) Check if policy already ingested
    from rag_engine.vector_store.store_factory import get_vector_store

    store = get_vector_store()
    if store.policy_exists(policy_id) and not overwrite:
        os.unlink(tmp_path)
        return IngestResponse(
            status="skipped",
            policy_id=policy_id,
            message="Policy already ingested. Pass overwrite=true to re-ingest.",
        )

    # d) Run ingestion in background
    background_tasks.add_task(_run_ingestion_from_file, policy_id, tmp_path, overwrite)

    return IngestResponse(
        status="processing",
        policy_id=policy_id,
        message=f"Ingestion started. Poll /ingest/status/{policy_id}",
    )


# ------------------------------------------------------------------ #
#  POST /ingest/summary/{policy_id}  (on-demand summary generation)
# ------------------------------------------------------------------ #
@router.post("/summary/{policy_id}", response_model=PolicySummaryResponse)
async def generate_summary(policy_id: str):
    """Generate (or re-generate) a structured policy summary on demand."""
    from rag_engine.services.summary_service import SummaryService

    svc = SummaryService()
    summary = svc.generate(policy_id)

    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary)

    svc.store(policy_id, summary)
    return PolicySummaryResponse(policy_id=policy_id, summary=summary)


# ------------------------------------------------------------------ #
#  GET /ingest/summary/{policy_id}  (fetch stored summary)
# ------------------------------------------------------------------ #
@router.get("/summary/{policy_id}", response_model=PolicySummaryResponse)
async def get_summary(policy_id: str):
    """Retrieve a previously generated policy summary."""
    from rag_engine.services.summary_service import SummaryService

    svc = SummaryService()
    row = svc.fetch(policy_id)

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"No summary found for policy_id={policy_id}",
        )

    return PolicySummaryResponse(
        policy_id=row["policy_id"], summary=row["summary"]
    )
