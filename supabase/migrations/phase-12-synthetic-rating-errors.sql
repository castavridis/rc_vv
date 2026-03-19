CREATE TABLE synthetic_rating_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  persona TEXT NOT NULL DEFAULT 'none',
  raw_response TEXT NOT NULL,
  error TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_synth_errors_artwork ON synthetic_rating_errors(artwork_id);
CREATE INDEX idx_synth_errors_user ON synthetic_rating_errors(user_id);
