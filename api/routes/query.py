"""Query router — answer questions against an ingested policy."""

from fastapi import APIRouter, HTTPException, Request

from api.schemas import QueryRequest, QueryResponse

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/", response_model=QueryResponse)
async def query_policy(body: QueryRequest, request: Request):
    """Run the RAG pipeline for a single policy question."""
    query_service = request.app.state.query_service

    try:
        result = query_service.query(
            question=body.question,
            policy_id=body.policy_id,
            k=body.k,
        )
    except Exception as exc:
        logger.exception("QueryService.query failed")
        raise HTTPException(status_code=500, detail=str(exc))

    if not result:
        raise HTTPException(status_code=500, detail="Empty result from QueryService")

    logger.info(
        "Query served | policy_id=%s | q='%s'",
        body.policy_id,
        body.question[:50],
    )

    return QueryResponse(
        answer=result["answer"],
        policy_id=result.get("policy_id", body.policy_id),
        source_count=result["source_count"],
        sources=result["sources"],
        status="success",
    )
