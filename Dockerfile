FROM python:3.11-slim

WORKDIR /app

# System deps — pymupdf needs these
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching — faster rebuilds)
COPY requirements.txt .

# Install Python deps
RUN pip install --no-cache-dir --timeout 300 --upgrade pip && \
    pip install --no-cache-dir --timeout 300 -r requirements.txt

# Pre-download reranker model at BUILD time
# Embedding is now via Jina API — no local model download needed
ENV HF_HOME=/app/model_cache
ENV SENTENCE_TRANSFORMERS_HOME=/app/model_cache/sentence_transformers
RUN python -c "from sentence_transformers import CrossEncoder; print('Downloading reranker...'); CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2'); print('Reranker cached.')"

# Copy entire project
COPY . .

# Temp dir for PDF uploads
RUN mkdir -p /tmp/policydecoder_uploads

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:7860/ || exit 1

# Start FastAPI server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
