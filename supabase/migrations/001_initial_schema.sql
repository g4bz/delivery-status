-- ============================================================================
-- DELIVERY DASHBOARD DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DELIVERY MANAGERS TABLE
-- ============================================================================
CREATE TABLE delivery_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  manager_id UUID NOT NULL REFERENCES delivery_managers(id) ON DELETE CASCADE,
  people INTEGER NOT NULL DEFAULT 0,
  satisfaction_score_q1 INTEGER CHECK (satisfaction_score_q1 BETWEEN 1 AND 100),
  satisfaction_score_q2 INTEGER CHECK (satisfaction_score_q2 BETWEEN 1 AND 100),
  satisfaction_score_q3 INTEGER CHECK (satisfaction_score_q3 BETWEEN 1 AND 100),
  satisfaction_score_q4 INTEGER CHECK (satisfaction_score_q4 BETWEEN 1 AND 100),
  quarterly_comment_q1 TEXT,
  quarterly_comment_q2 TEXT,
  quarterly_comment_q3 TEXT,
  quarterly_comment_q4 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WEEKLY STATUSES TABLE
-- ============================================================================
CREATE TABLE weekly_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  week DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'attention', 'critical')),
  people INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, week)
);

-- ============================================================================
-- ACTION ITEMS TABLE
-- ============================================================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES delivery_managers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_accounts_manager_id ON accounts(manager_id);
CREATE INDEX idx_weekly_statuses_account_id ON weekly_statuses(account_id);
CREATE INDEX idx_weekly_statuses_week ON weekly_statuses(week);
CREATE INDEX idx_weekly_statuses_account_week ON weekly_statuses(account_id, week);
CREATE INDEX idx_action_items_account_id ON action_items(account_id);
CREATE INDEX idx_action_items_manager_id ON action_items(manager_id);
CREATE INDEX idx_action_items_completed ON action_items(completed);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_managers_updated_at
  BEFORE UPDATE ON delivery_managers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_statuses_updated_at
  BEFORE UPDATE ON weekly_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE delivery_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can customize these based on your auth needs)
CREATE POLICY "Allow all operations on delivery_managers" ON delivery_managers FOR ALL USING (true);
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on weekly_statuses" ON weekly_statuses FOR ALL USING (true);
CREATE POLICY "Allow all operations on action_items" ON action_items FOR ALL USING (true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE delivery_managers IS 'Stores information about delivery managers';
COMMENT ON TABLE accounts IS 'Stores client accounts managed by delivery managers';
COMMENT ON TABLE weekly_statuses IS 'Tracks weekly health status for each account';
COMMENT ON TABLE action_items IS 'Stores action items and tasks for accounts';
