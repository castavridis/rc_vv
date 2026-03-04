-- Phase 5: Canvas & Composition
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  canvas_state JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS compositions_session_id_idx ON compositions (session_id);

-- Storage bucket for composition thumbnails
-- Create manually: Supabase dashboard → Storage → New bucket
-- Name: compositions, Public: true
