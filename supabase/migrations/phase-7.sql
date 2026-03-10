-- Phase 7: Add reason column to artwork_ratings
ALTER TABLE artwork_ratings
  ADD COLUMN reason TEXT;
