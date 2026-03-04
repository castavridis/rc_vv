-- Phase 3: Session & Brand Profile
-- Run this in the Supabase SQL editor

-- Add updated_at update function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update sessions.updated_at on row update
CREATE TRIGGER sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Slider history
-- Note: Users.id is BIGINT in this project
CREATE TABLE IF NOT EXISTS slider_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES "Users"(id),
  dimension TEXT NOT NULL CHECK (dimension IN ('Sincerity','Excitement','Competence','Sophistication','Ruggedness')),
  value NUMERIC NOT NULL CHECK (value >= 0 AND value <= 5),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slider_history_session_id_idx ON slider_history (session_id);
