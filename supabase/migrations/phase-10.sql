-- Phase 10: Convert trait scores from 0-5 scale to binary (0/1)
-- Dimension-level scores (Sincerity, Excitement, Competence, Sophistication, Ruggedness) remain on 0-5.

-- Convert existing trait scores: threshold at 2.5 (>= 2.5 → 1, < 2.5 → 0)
UPDATE artwork_ratings
SET score = CASE WHEN score >= 2.5 THEN 1 ELSE 0 END
WHERE trait NOT IN ('Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness');

-- Add CHECK constraint for trait scores (binary)
-- Note: dimension rows keep 0-5, trait rows must be 0 or 1
ALTER TABLE artwork_ratings
ADD CONSTRAINT chk_trait_score_binary CHECK (
  trait IN ('Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness')
  OR score IN (0, 1)
);
