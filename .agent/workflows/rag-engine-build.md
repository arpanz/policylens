---
description: # RAG Engine Build Workflow — PolicyDecoder
---

# RAG Engine Build Workflow — PolicyDecoder

## Project Context
Python RAG engine for PolicyDecoder AI.
Folder: `rag_engine/` inside the monorepo root.
Branch: `feat/rag-engine`

## Rules the Agent Must Follow
1. ALL Python files go inside `rag_engine/` — never outside it.
2. Never touch `main` branch — always stay on `feat/rag-engine`.
3. Every new file must have a module docstring at the top.
4. Use `pydantic-settings` for all config — never hardcode API keys.
5. Never write frontend, backend, API routing, or deployment code.
6. Every class must have a docstring explaining its responsibility.
7. After creating files, always run `python -m pytest rag_engine/tests/ -v`
8. Always use `from utils.logger import get_logger` for logging.
9. Never commit `.env` — only `.env.example`.
10. Commit after EVERY agent prompt task completes — not after entire phases.
    One logical unit of work = one git commit. Never bundle multiple
    unrelated changes into a single commit.
11. Always run tests before committing:
    `python -m pytest rag_engine/tests/ -v`
    Never commit if tests are failing.
12. Stage ONLY the files created or modified in the current task.
    Never use: `git add .`
    Always use: `git add <specific-files-or-folders>`
    This prevents accidentally staging .env or unrelated changes.
13. Commit message format (Conventional Commits standard):
    `feat(rag): short description`       ← new functionality
    `fix(rag): short description`        ← bug fix
    `test(rag): short description`       ← test files only
    `chore(rag): short description`      ← config, deps, non-code
    `refactor(rag): short description`   ← restructure, no behaviour change
    `docs(rag): short description`       ← README, docstrings only
14. After every commit, push immediately:
    `git push origin feat/rag-engine`
15. Never commit these files ever:
    `.env`, `__pycache__/`, `*.pyc`, `.venv/`
    If you accidentally stage .env: `git reset HEAD .env`

## Tech Stack
- Python 3.11+
- llama-parse for PDF parsing
- Supabase pgvector (via langchain-community SupabaseVectorStore) for vector storage
- LangChain + langchain-openai for retrieval
- Kimi K2.5 via Moonshot AI OpenAI-compatible API (base_url: https://api.moonshot.ai/v1)
- openai Python SDK with custom base_url for Kimi
- sentence-transformers (BAAI/bge-large-en-v1.5, 768-dim) for embeddings
  LOCAL model — zero API cost, no key needed
  Fallback: Jina Embeddings v3 API (jina-embeddings-v3, needs JINA_API_KEY)
- pydantic v2 + pydantic-settings for schemas
- tiktoken for token counting
- pytest for testing

## Vector Store Notes
- Supabase pgvector is used — NOT ChromaDB
- Policy isolation is done via metadata JSONB column: metadata->>'policy_id'
- The table name is: policy_chunks
- Embedding dimension: 768 (BAAI/bge-large-en-v1.5 local default)
  If switching to Jina: 1024. If switching to OpenAI: 1536.

## LLM Notes
- Primary LLM: Kimi K2.5 via Moonshot AI
- API base: https://api.moonshot.ai/v1
- Model name: kimi-k2.5
- API is OpenAI-compatible — use ChatOpenAI from langchain-openai with custom base_url
- Fallback LLM: GPT-4o via OpenAI (same interface, just change base_url + model)

## Phases
- Phase 1: Parsing & Chunking (ingestion/, chunking/, schemas/chunk_metadata.py)
- Phase 2: Embedding pipeline (embeddings/)
- Phase 3: Vector storage (vector_store/ using Supabase pgvector)
- Phase 4: Retrieval logic (retrieval/)
- Phase 5: Prompt system + Kimi K2.5 LLM (prompts/, llm/)
- Phase 6: End-to-end service (services/, main.py)
- Phase 7: Evaluation & tuning (tests/)
