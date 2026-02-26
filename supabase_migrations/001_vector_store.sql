-- Supabase pgvector setup for PolicyDecoder
-- run this ONCE in supabase SQL editor before any ingestion
-- Embedding dimension: 768 (BAAI/bge-large-en-v1.5 via sentence-transformers)
-- To switch to Jina v3 (1024-dim) later:
--   ALTER TABLE policy_chunks ALTER COLUMN embedding TYPE vector(1024);
-- To switch to OpenAI (1536-dim) later:
--   ALTER TABLE policy_chunks ALTER COLUMN embedding TYPE vector(1536);

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS policy_chunks (
    id          bigserial       PRIMARY KEY,
    content     text            NOT NULL,
    metadata    jsonb           NOT NULL DEFAULT '{}'::jsonb,
    embedding   vector(768)    NOT NULL,
    created_at  timestamptz     NOT NULL DEFAULT now()
);

-- hnsw index for fast ANN search
CREATE INDEX IF NOT EXISTS policy_chunks_embedding_hnsw_idx
    ON policy_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- gin index on metadata for jsonb filtering (policy_id etc)
CREATE INDEX IF NOT EXISTS policy_chunks_metadata_gin_idx
    ON policy_chunks
    USING gin (metadata);

-- rpc function that langchain calls for similarity search
-- filters by metadata containment (@>) then orders by cosine distance
CREATE OR REPLACE FUNCTION match_policy_chunks(
    query_embedding  vector(768),
    match_count      int,
    filter           jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id          bigint,
    content     text,
    metadata    jsonb,
    similarity  float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.id,
        pc.content,
        pc.metadata,
        (1 - (pc.embedding <=> query_embedding))::float AS similarity
    FROM policy_chunks pc
    WHERE pc.metadata @> filter
    ORDER BY pc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
