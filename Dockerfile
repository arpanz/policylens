FROM python:3.11-slim

WORKDIR /app

# System deps for torch / sentence-transformers
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching — faster rebuilds)
COPY requirements.txt .

# Install Python deps
RUN pip install --no-cache-dir --timeout 300 --upgrade pip && \
    pip install --no-cache-dir --timeout 300 -r requirements.txt

# Pre-download embedding model at BUILD time so cold starts are instant
# Model: BAAI/bge-large-en-v1.5 (~1.3GB) — baked into image layer
RUN python -c "
from sentence_transformers import SentenceTransformer
import os
print('Downloading BAAI/bge-large-en-v1.5 into image...')
model = SentenceTransformer('BAAI/bge-large-en-v1.5', device='cpu')
print('Model downloaded and cached.')
"

# Copy entire project
COPY . .

# Temp dir for PDF uploads
RUN mkdir -p /tmp/policydecoder_uploads

# Expose port
EXPOSE 7860

# Health check — use root endpoint (fast, no DB call)
# start-period=30s is enough since model is pre-baked — no download needed
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:7860/ || exit 1

# Start FastAPI server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
