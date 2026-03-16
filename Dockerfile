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

# Pre-download embedding model at BUILD time into /app/model_cache
# This path is inside WORKDIR and persists into the running container
ENV HF_HOME=/app/model_cache
ENV SENTENCE_TRANSFORMERS_HOME=/app/model_cache/sentence_transformers
RUN python -c "from sentence_transformers import SentenceTransformer; print('Downloading model...'); SentenceTransformer('BAAI/bge-large-en-v1.5', device='cpu'); print('Model cached.')"

# Copy entire project
COPY . .

# Temp dir for PDF uploads
RUN mkdir -p /tmp/policydecoder_uploads

# Expose port
EXPOSE 7860

# Health check — start-period=30s since model is pre-baked, no download needed
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:7860/ || exit 1

# Start FastAPI server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
