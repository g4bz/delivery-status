-- ============================================================================
-- UPDATE SATISFACTION SCORE RANGE: Change from 1-10 to 1-100
-- ============================================================================

-- Drop the old constraint on satisfaction_scores table
ALTER TABLE satisfaction_scores DROP CONSTRAINT IF EXISTS satisfaction_scores_score_check;

-- Add new constraint for 1-100 range
ALTER TABLE satisfaction_scores ADD CONSTRAINT satisfaction_scores_score_check CHECK (score BETWEEN 1 AND 100);

-- Update comment to reflect the change
COMMENT ON COLUMN satisfaction_scores.score IS 'Satisfaction score from 1 to 100';
