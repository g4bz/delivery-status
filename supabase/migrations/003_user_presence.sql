-- ============================================================================
-- USER PRESENCE TRACKING
-- ============================================================================

-- Add profile_picture field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS initials VARCHAR(10);

-- Create user_presence table to track active users
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  profile_picture TEXT,
  initials VARCHAR(10),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for fast presence lookups
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

-- Enable RLS on user_presence table
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Allow all operations on user_presence (customize based on your needs)
CREATE POLICY "Allow all operations on user_presence" ON user_presence FOR ALL USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE last_seen < NOW() - INTERVAL '5 minutes'
  AND is_online = true;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_presence IS 'Tracks which users are currently active/online in the system';
COMMENT ON COLUMN user_presence.last_seen IS 'Timestamp of last activity, used to determine if user is still online';
COMMENT ON COLUMN user_presence.is_online IS 'Boolean flag indicating if user is currently active';
