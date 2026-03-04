-- Phase 2: Assessment Pipeline
-- Run this in the Supabase SQL editor

-- Sessions (minimal — expanded in Phase 3)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  auto_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

-- Session inputs (text or image)
CREATE TABLE IF NOT EXISTS session_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  content_url TEXT,
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_inputs_session_id_idx ON session_inputs (session_id);

-- Trait profiles (one row per session × trait × model)
CREATE TABLE IF NOT EXISTS trait_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  trait TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 5),
  model TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'assessed' CHECK (source IN ('assessed', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trait_profiles_session_id_idx ON trait_profiles (session_id);

-- Storage bucket for session image inputs
-- Run separately in Supabase dashboard → Storage → New bucket:
-- Name: inputs, Public: true
