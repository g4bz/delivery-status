-- ============================================================================
-- ADD CREATED BY USER TRACKING TO ACTION ITEMS
-- ============================================================================

-- Add columns to action_items table for tracking who created the item
ALTER TABLE action_items
  ADD COLUMN created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN created_by_user_name VARCHAR(255);

-- Add index for performance
CREATE INDEX idx_action_items_created_by ON action_items(created_by_user_id);

-- Comments for documentation
COMMENT ON COLUMN action_items.created_by_user_id IS 'ID of the user who created the action item';
COMMENT ON COLUMN action_items.created_by_user_name IS 'Name of the user who created the action item';
