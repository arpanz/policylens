---
title: PolicyLens RAG API
emoji: 🔍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# PolicyLens — AI Insurance Policy Decoder

AI to decode and explain complex insurance/mortgage clauses in simple, easy-to-understand terms.

## Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** Supabase (Vector DB + Storage)
- **AI:** Kimi API (Moonshot)
- **Other:** LlamaParse (OCR), RAG (LangChain)

## Features

1. Upload PDF/Images (Batch Upload)
2. Summary Cards — key coverage, deductibles, exclusions
3. AI Chat — ask questions about your policy in plain language
4. Chat History — revisit past Q&A per policy
5. User Authentication — register, login, JWT-based sessions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get logged-in user info |
| POST | `/ingest/upload` | Upload policy PDF/image |
| GET | `/ingest/status/{policy_id}` | Check ingestion status |
| GET | `/ingest/summary/{policy_id}` | Get AI-generated summary |
| POST | `/query/ask` | Ask a question about a policy |
| GET | `/history/{policy_id}` | Get chat history for a policy |

## Live API Docs

[https://devjhawar-policylens-rag-api.hf.space/docs](https://devjhawar-policylens-rag-api.hf.space/docs)
