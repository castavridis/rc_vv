-- Phase 1: Artwork Library & Taste Calibration
-- Run this in the Supabase SQL editor

-- Artworks
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  year INT,
  image_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'met', 'rijksmuseum', 'wikiart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Artwork ratings (one row per user × artwork × trait)
CREATE TABLE IF NOT EXISTS artwork_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  trait TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, artwork_id, trait)
);

-- Indexes
CREATE INDEX IF NOT EXISTS artwork_ratings_user_id_idx ON artwork_ratings (user_id);
CREATE INDEX IF NOT EXISTS artwork_ratings_artwork_id_idx ON artwork_ratings (artwork_id);
CREATE INDEX IF NOT EXISTS artwork_ratings_trait_idx ON artwork_ratings (trait);

-- Storage bucket for artwork images
-- If running via SQL editor, run this separately:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('artworks', 'artworks', true)
-- ON CONFLICT (id) DO NOTHING;
