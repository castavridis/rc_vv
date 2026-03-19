-- Add soft-delete to error log
ALTER TABLE synthetic_rating_errors ADD COLUMN resolved_at TIMESTAMPTZ DEFAULT NULL;

-- Prompt configuration history per (user, model, persona)
CREATE TABLE prompt_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  persona TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_prompt_configs_active
  ON prompt_configs (user_id, model, persona)
  WHERE is_active = true;
CREATE INDEX idx_prompt_configs_combo ON prompt_configs(user_id, model, persona);
