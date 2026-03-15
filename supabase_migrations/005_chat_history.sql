CREATE TABLE chat_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  policy_id    TEXT NOT NULL,
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  sources      JSONB DEFAULT '[]',
  source_count INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_history_user_id   ON chat_history(user_id);
CREATE INDEX idx_chat_history_policy_id ON chat_history(policy_id);
