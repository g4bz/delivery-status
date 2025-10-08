-- ============================================================================
-- ADD NEW FEATURES: Notes, Billed Amount, Language Stack
-- ============================================================================

-- Add notes field to weekly_statuses
ALTER TABLE weekly_statuses ADD COLUMN notes TEXT DEFAULT '';

-- Add language_stack and monthly billing to accounts
ALTER TABLE accounts
  ADD COLUMN language_stack TEXT[] DEFAULT '{}',
  ADD COLUMN primary_language VARCHAR(100);

-- Create billing table for monthly billed amounts
CREATE TABLE account_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,  -- First day of the month (e.g., 2025-08-01)
  billed_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, billing_month)
);

-- Create satisfaction_scores table for better year/quarter management
CREATE TABLE satisfaction_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  score INTEGER CHECK (score BETWEEN 1 AND 10),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, year, quarter)
);

-- Indexes
CREATE INDEX idx_account_billing_account_id ON account_billing(account_id);
CREATE INDEX idx_account_billing_month ON account_billing(billing_month);
CREATE INDEX idx_satisfaction_scores_account_id ON satisfaction_scores(account_id);
CREATE INDEX idx_satisfaction_scores_year_quarter ON satisfaction_scores(year, quarter);

-- Triggers
CREATE TRIGGER update_account_billing_updated_at
  BEFORE UPDATE ON account_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_satisfaction_scores_updated_at
  BEFORE UPDATE ON satisfaction_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE account_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on account_billing" ON account_billing FOR ALL USING (true);
CREATE POLICY "Allow all operations on satisfaction_scores" ON satisfaction_scores FOR ALL USING (true);

-- Migrate existing satisfaction scores from accounts table to satisfaction_scores table
-- This will extract Q1-Q4 scores and insert them into the new table
DO $$
DECLARE
  account_record RECORD;
BEGIN
  FOR account_record IN SELECT id, satisfaction_score_q1, satisfaction_score_q2, satisfaction_score_q3, satisfaction_score_q4,
                                quarterly_comment_q1, quarterly_comment_q2, quarterly_comment_q3, quarterly_comment_q4
                         FROM accounts
  LOOP
    -- Insert Q1 if exists
    IF account_record.satisfaction_score_q1 IS NOT NULL THEN
      INSERT INTO satisfaction_scores (account_id, year, quarter, score, comments)
      VALUES (account_record.id, 2025, 1, account_record.satisfaction_score_q1, account_record.quarterly_comment_q1)
      ON CONFLICT (account_id, year, quarter) DO NOTHING;
    END IF;

    -- Insert Q2 if exists
    IF account_record.satisfaction_score_q2 IS NOT NULL THEN
      INSERT INTO satisfaction_scores (account_id, year, quarter, score, comments)
      VALUES (account_record.id, 2025, 2, account_record.satisfaction_score_q2, account_record.quarterly_comment_q2)
      ON CONFLICT (account_id, year, quarter) DO NOTHING;
    END IF;

    -- Insert Q3 if exists
    IF account_record.satisfaction_score_q3 IS NOT NULL THEN
      INSERT INTO satisfaction_scores (account_id, year, quarter, score, comments)
      VALUES (account_record.id, 2025, 3, account_record.satisfaction_score_q3, account_record.quarterly_comment_q3)
      ON CONFLICT (account_id, year, quarter) DO NOTHING;
    END IF;

    -- Insert Q4 if exists
    IF account_record.satisfaction_score_q4 IS NOT NULL THEN
      INSERT INTO satisfaction_scores (account_id, year, quarter, score, comments)
      VALUES (account_record.id, 2025, 4, account_record.satisfaction_score_q4, account_record.quarterly_comment_q4)
      ON CONFLICT (account_id, year, quarter) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Comments
COMMENT ON TABLE account_billing IS 'Stores monthly billing amounts for accounts';
COMMENT ON TABLE satisfaction_scores IS 'Stores satisfaction scores by year and quarter for accounts';
COMMENT ON COLUMN weekly_statuses.notes IS 'Weekly notes for tracking specific information';
COMMENT ON COLUMN accounts.language_stack IS 'Array of programming languages/technologies used';
