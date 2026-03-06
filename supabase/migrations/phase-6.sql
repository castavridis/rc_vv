-- Phase 6: Personal Image Library with Extended Metadata

-- Add personal ownership and extended metadata to artworks
ALTER TABLE artworks
  ADD COLUMN user_id BIGINT REFERENCES "Users"(id) ON DELETE CASCADE,
  ADD COLUMN description TEXT,
  ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN medium TEXT,
  ADD COLUMN source_url TEXT;

-- Index for personal library queries
CREATE INDEX artworks_user_id_idx ON artworks (user_id);

-- Index for bookmarklet deduplication (check if URL already saved)
CREATE INDEX artworks_source_url_idx ON artworks (source_url);
