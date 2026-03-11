-- Phase 8: Libraries
CREATE TABLE libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id BIGINT REFERENCES "Users"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE artworks
  ADD COLUMN library_id UUID REFERENCES libraries(id) ON DELETE SET NULL;

CREATE INDEX artworks_library_id_idx ON artworks (library_id);
