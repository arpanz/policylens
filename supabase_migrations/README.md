# Supabase Migrations — PolicyDecoder

## How to Run

1. Open the **Supabase Dashboard** for your project.
2. Navigate to **SQL Editor → New Query**.
3. Paste the contents of `001_vector_store.sql` into the editor.
4. Click **Run** (or press Ctrl+Enter).

> IMPORTANT: This migration must be run **once** by the backend team **before** any
> document ingestion is attempted. The RAG engine will fail to write
> embeddings if the `policy_chunks` table does not exist.

## How to Verify

After running the migration, confirm everything was created:

```sql
-- Table exists
SELECT * FROM policy_chunks LIMIT 0;

-- HNSW index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'policy_chunks';

-- RPC function exists
SELECT match_policy_chunks(
    '[0,0,0]'::vector(1536),  -- dummy embedding
    1,                         -- match_count
    '{}'::jsonb                -- no filter
);
```

## Metadata JSONB Column

The `metadata` column stores all chunk-level context as a JSON object.
This enables **policy isolation** — each chunk carries a `policy_id` field
so retrieval queries can filter to a single policy document:

```json
{
  "policy_id": "POL-2024-001",
  "clause_type": "coverage",
  "section_title": "Section 3 — Fire Coverage",
  "page_number": 12,
  "chunk_index": 4,
  "source_file": "fire_policy_2024.pdf"
}
```

The RPC function uses `metadata @> filter` (JSONB containment), so a
query like `filter = '{"policy_id": "POL-2024-001"}'` will return only
chunks belonging to that policy.

## Embedding Dimension

The default dimension is **1536** (OpenAI `text-embedding-3-large`).
If you switch to local `sentence-transformers` embeddings (768-dim),
update `vector(1536)` to `vector(768)` in the SQL file before running.
