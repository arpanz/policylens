---
title: PolicyLens RAG API
emoji: 🔍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

Here's the full README.md content for you to copy:

```markdown
# PolicyLens

**PolicyLens** is an AI-powered insurance policy analysis platform. Upload any PDF policy document and IRIS — our RAG-based AI engine — instantly parses, indexes, and lets you query it in plain English. Get structured summaries, ask specific questions, and chat with your policy document.

---

## Features

- **Instant PDF Parsing** — PyMuPDF-based local parser (~0.2s), no cloud OCR dependency
- **Semantic Search** — Jina Embeddings v3 (768-dim) with cosine similarity over Supabase pgvector
- **Cross-Encoder Reranking** — BGE reranker re-scores retrieved chunks for precision
- **IRIS Chat** — Streaming AI chat powered by Kimi (Moonshot AI) with full context from your document
- **Auto Summary** — Structured policy summary generated on upload (coverage, exclusions, premiums, benefits)
- **Chat History** — All conversations persisted in Supabase per user per policy
- **Auth** — JWT-based signup/login via Node.js backend with Supabase user store
- **Dark / Light Mode** — Full theme support across all pages

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        Browser                              │
│           React 19 + Vite 7 + Tailwind 4                    │
│  Home → Login → Upload → Dashboard → IRIS Chat              │
└──────────────────────┬─────────────────────────────────────┘
                       │  REST (localhost:4000)
┌──────────────────────▼─────────────────────────────────────┐
│                  Node.js Backend                             │
│           Express · JWT Auth · Supabase SDK                  │
│  /auth/signup  /auth/login                                   │
│  /api/ingest/* /api/query  /api/history                      │
└──────────────────────┬─────────────────────────────────────┘
                       │  HTTP proxy (localhost:8000)
┌──────────────────────▼─────────────────────────────────────┐
│               Python RAG Engine (FastAPI)                    │
│  PDF Loader (PyMuPDF) → Cleaner → Chunker                    │
│  → Jina Embedder → Supabase pgvector                         │
│  → Retriever → CrossEncoder Reranker → Kimi LLM              │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                     Supabase                                 │
│  policy_chunks (pgvector) · policy_summaries                 │
│  policies · users · chat_history                             │
└────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Lucide React |
| Backend | Node.js, Express, JWT, Supabase JS SDK |
| RAG Engine | Python 3.11, FastAPI, Uvicorn |
| PDF Parsing | pymupdf4llm (local, ~0.2s) |
| Embeddings | Jina Embeddings v3 API (768-dim) |
| Vector Store | Supabase pgvector |
| Reranker | sentence-transformers CrossEncoder |
| LLM | Kimi / Moonshot AI (kimi-k2.5) |
| Database | Supabase (PostgreSQL) |

---

## Project Structure

```
policylens/
├── frontend/                  # React app (Vite)
│   └── src/
│       ├── App.jsx            # Root router (hash-based)
│       ├── api.js             # Fetch wrapper with JWT auth
│       └── components/
│           ├── Auth/          # Login + Signup
│           ├── Dashboard/     # Dboard.jsx, Chatbot.jsx, UploadModal.jsx
│           ├── Hero/          # Landing page
│           ├── Navbar/
│           ├── Footer/
│           └── About/
│
├── backend/                   # Node.js Express server
│   └── src/
│       ├── index.js           # Entry point
│       ├── routes/
│       │   ├── auth.js        # /auth/signup, /auth/login
│       │   ├── ingest.js      # Proxies upload/status/summary to Python
│       │   ├── query.js       # Proxies chat queries to Python
│       │   └── history.js     # Chat history CRUD via Supabase
│       ├── middleware/        # JWT auth middleware
│       └── config/            # Supabase client setup
│
├── api/                       # FastAPI app (Python)
│   ├── main.py                # FastAPI app, lifespan, CORS
│   └── routes/
│       ├── ingest.py          # POST /ingest/upload, GET /ingest/status/:id, GET /ingest/summary/:id
│       ├── query.py           # POST /query (stream + non-stream)
│       └── health.py          # GET /health
│
├── rag_engine/                # Core RAG logic
│   ├── ingestion/
│   │   ├── pdf_loader.py      # PyMuPDF parser (LlamaParse fallback via USE_LLAMAPARSE=true)
│   │   ├── cleaner.py         # Text normalisation
│   │   ├── chunker.py         # Semantic chunking with page boundary tracking
│   │   └── pipeline.py        # Orchestrates load → clean → chunk
│   ├── embeddings/
│   │   ├── jina_embedder.py   # Jina v3 API (default, 768-dim)
│   │   └── local_embedder.py  # BGE local fallback (CPU)
│   ├── vector_store/
│   │   └── supabase_store.py  # pgvector upsert + similarity search
│   ├── retrieval/
│   │   ├── retriever.py       # k-NN vector search
│   │   ├── reranker.py        # CrossEncoder reranker
│   │   ├── context_builder.py # Builds prompt context from chunks
│   │   └── query_preprocessor.py
│   ├── llm/
│   │   └── kimi_llm.py        # Kimi/Moonshot AI client (stream + complete)
│   ├── services/
│   │   ├── ingestion_service.py  # End-to-end ingest orchestration
│   │   ├── query_service.py      # End-to-end query + streaming
│   │   └── summary_service.py    # Auto policy summary on upload
│   ├── prompts/               # System prompts, query templates, response formatter
│   ├── config/
│   │   └── settings.py        # Pydantic settings (reads .env)
│   └── utils/
│       ├── status_tracker.py  # In-memory ingestion progress tracker
│       ├── retry.py           # Exponential backoff decorator
│       └── logger.py
│
├── supabase_migrations/       # SQL migration files (run in order)
│   ├── 001_vector_store.sql   # policy_chunks table + pgvector index
│   ├── 002_policy_summaries.sql
│   ├── 003_users.sql
│   ├── 004_policies.sql
│   └── 005_chat_history.sql
│
├── .env.example               # Root env template (Python RAG engine)
├── requirements.txt           # Python dependencies
├── Dockerfile
└── docker-compose.yml
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project
- [Jina AI](https://jina.ai) API key (free tier available)
- [Moonshot AI](https://platform.moonshot.cn) API key (Kimi)

---

### 1. Supabase — Run Migrations

In your Supabase project → **SQL Editor**, run the files in `supabase_migrations/` in order from `001` to `005`.

---

### 2. Python RAG Engine

```bash
# From project root
pip install -r requirements.txt

cp .env.example .env
```

Edit `.env`:

```env
MOONSHOT_API_KEY=your_moonshot_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

EMBEDDING_PROVIDER=jina
JINA_API_KEY=jina_xxxxxxxxxxxxxxxx

# Not actively used but required by settings — set any value
LLAMA_CLOUD_API_KEY=not_used
```

Start the server:

```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Running at `http://localhost:8000`

---

### 3. Node.js Backend

```bash
cd backend
npm install

cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=4000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=any_random_string_here
PYTHON_API_URL=http://localhost:8000
```

```bash
npm run dev
```

✅ Running at `http://localhost:4000`

---

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Running at `http://localhost:5173`

---

## API Reference

### Auth (Node.js — port 4000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register with email + password |
| POST | `/auth/login` | Login, returns JWT token |

### Ingest (Node.js proxy → Python)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ingest/upload` | ✅ | Upload PDF, starts background ingestion |
| GET | `/api/ingest/status/:policy_id` | ✅ | Poll ingestion progress (0–100%) |
| GET | `/api/ingest/summary/:policy_id` | ✅ | Get structured policy summary |

### Query (Node.js proxy → Python)

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/query` | ✅ | `{ question, policy_id }` | Single-turn RAG query |
| POST | `/api/query/stream` | ✅ | `{ question, policy_id }` | Streaming token response |

### History (Node.js → Supabase)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history` | ✅ | Get all chat history for current user |
| POST | `/api/history` | ✅ | Save a chat message |
| DELETE | `/api/history/:policy_id` | ✅ | Clear history for a policy |

> All `/api/*` routes require `Authorization: Bearer <token>` header.

---

## Ingestion Pipeline

```
PDF Upload
  ↓
PyMuPDF (local, ~0.2s)       ← replaces LlamaParse cloud OCR
  ↓
Text Cleaner
  ↓
Semantic Chunker (~31 chunks per 20-page doc)
  ↓
Jina Embeddings v3 (768-dim, batches of 100)
  ↓
Supabase pgvector (batch upsert)
  ↓
Auto Summary (Kimi LLM, top-15 chunks)
  ↓
Status → "ready"
```

Set `USE_LLAMAPARSE=true` in `.env` to fall back to LlamaParse cloud parsing.

---

## Query Pipeline

```
User Question
  ↓
Query Preprocessor
  ↓
Jina embed_query (single vector)
  ↓
pgvector similarity_search (k=8)
  ↓
CrossEncoder Reranker (top 5)
  ↓
Context Builder (~3400 tokens)
  ↓
Kimi LLM (stream or complete)
  ↓
Response + Sources
```

---

## Environment Variables

### Root `.env` (Python RAG Engine)

| Variable | Required | Description |
|----------|----------|-------------|
| `MOONSHOT_API_KEY` | ✅ | Kimi/Moonshot API key |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key |
| `JINA_API_KEY` | ✅ | Jina AI API key |
| `EMBEDDING_PROVIDER` | ✅ | `jina` or `local` |
| `LLAMA_CLOUD_API_KEY` | — | Only needed if `USE_LLAMAPARSE=true` |
| `USE_LLAMAPARSE` | — | Set `true` to use LlamaParse instead of PyMuPDF |
| `DEBUG` | — | `true` for verbose logs |

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | — | Default `4000` |
| `SUPABASE_URL` | ✅ | Same as above |
| `SUPABASE_SERVICE_KEY` | ✅ | Same as above |
| `JWT_SECRET` | ✅ | Any random string for signing tokens |
| `PYTHON_API_URL` | ✅ | Default `http://localhost:8000` |

---

## Team

| Name | Role |
|------|------|
| Arpan Singh | Frontend, Backend, Integration |
| Dev Jhawar | RAG Engine, Embeddings, LLM |
| Paavan | Frontend, Auth, React Router |
```
