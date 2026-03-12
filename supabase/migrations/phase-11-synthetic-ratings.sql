CREATE TABLE synthetic_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  trait TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 5),
  reason TEXT DEFAULT '',
  model TEXT NOT NULL,
  persona TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artwork_id, trait, model, persona)
);
CREATE INDEX idx_synth_ratings_artwork ON synthetic_ratings(artwork_id);
CREATE INDEX idx_synth_ratings_model ON synthetic_ratings(model, persona);
