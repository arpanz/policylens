"""PolicyDecoder RAG API — FastAPI application entry point."""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes.query import router as query_router
from api.routes.ingest import router as ingest_router
from api.routes.health import router as health_router

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ #
#  Lifespan — pre-load heavy components once at startup
# ------------------------------------------------------------------ #
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load QueryService on startup so the first request is fast."""
    from rag_engine.services.query_service import QueryService

    app.state.query_service = QueryService()
    logger.info("QueryService loaded and ready")
    yield  # app is running
    # shutdown cleanup (nothing required for now)


# ------------------------------------------------------------------ #
#  App
# ------------------------------------------------------------------ #
app = FastAPI(
    title="PolicyDecoder RAG API",
    description="AI-powered insurance policy Q&A engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — wide open for development; backend team will restrict in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------ #
#  Routers
# ------------------------------------------------------------------ #
app.include_router(query_router)
app.include_router(ingest_router)
app.include_router(health_router)

# ------------------------------------------------------------------ #
#  Dev entry point
# ------------------------------------------------------------------ #
if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
