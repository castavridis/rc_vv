-- Phase 4: Asset Generation
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  task TEXT NOT NULL CHECK (task IN ('summary', 'hex_color', 'image', 'svg', 'animation')),
  trait TEXT,
  dimension_weights JSONB,
  model TEXT NOT NULL,
  storage_url TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'saving', 'done', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_assets_session_id_idx ON generated_assets (session_id);
CREATE INDEX IF NOT EXISTS generated_assets_task_idx ON generated_assets (task);

-- Storage bucket for generated assets
-- Create manually in Supabase dashboard → Storage → New bucket:
-- Name: assets, Public: true
