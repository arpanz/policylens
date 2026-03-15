-- Migration: Create the policy_summaries table
-- Run this manually in the Supabase SQL editor before using the summary endpoint.

CREATE TABLE policy_summaries (
  policy_id TEXT PRIMARY KEY,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
