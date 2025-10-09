-- ============================================================================
-- ADD USER TRACKING TO ACTION ITEMS AND WEEKLY NOTES
-- ============================================================================

-- Add columns to action_items table for tracking completion
ALTER TABLE action_items
  ADD COLUMN completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN completed_by_user_name VARCHAR(255),
  ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add columns to weekly_statuses table for tracking note creation
ALTER TABLE weekly_statuses
  ADD COLUMN created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN created_by_user_name VARCHAR(255);

-- Add indexes for performance
CREATE INDEX idx_action_items_completed_by ON action_items(completed_by_user_id);
CREATE INDEX idx_weekly_statuses_created_by ON weekly_statuses(created_by_user_id);

-- Comments for documentation
COMMENT ON COLUMN action_items.completed_by_user_id IS 'ID of the user who marked the action item as completed';
COMMENT ON COLUMN action_items.completed_by_user_name IS 'Name of the user who marked the action item as completed';
COMMENT ON COLUMN action_items.completed_at IS 'Timestamp when the action item was completed';
COMMENT ON COLUMN weekly_statuses.created_by_user_id IS 'ID of the user who created the weekly note';
COMMENT ON COLUMN weekly_statuses.created_by_user_name IS 'Name of the user who created the weekly note';
