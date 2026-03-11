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

# Copy entire project
COPY . .

# Temp dir for PDF uploads
RUN mkdir -p /tmp/policydecoder_uploads

# Expose port
EXPOSE 7860

# Health check — Docker restarts container if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Start FastAPI server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
