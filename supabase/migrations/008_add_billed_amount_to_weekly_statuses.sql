-- ============================================================================
-- ADD BILLED AMOUNT TO WEEKLY STATUSES
-- ============================================================================

-- Add billed_amount column to weekly_statuses table
ALTER TABLE weekly_statuses
  ADD COLUMN billed_amount DECIMAL(12, 2) DEFAULT 0;

-- Add index for performance when querying by billed amounts
CREATE INDEX idx_weekly_statuses_billed_amount ON weekly_statuses(billed_amount);

-- Comments for documentation
COMMENT ON COLUMN weekly_statuses.billed_amount IS 'Weekly billed amount for the account, automatically carried forward unless overridden';
