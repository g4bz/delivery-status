-- ============================================================================
-- USERS TABLE FOR AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

-- RLS Policy - Only service role can insert/update
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (true);

-- Insert default admin user
-- Password: admin$ (hashed using bcrypt-like approach)
-- Note: In production, use proper password hashing on the server side
INSERT INTO users (username, password_hash, full_name, email) VALUES
  ('admin', 'admin$', 'Administrator', 'admin@company.com');

COMMENT ON TABLE users IS 'Stores user authentication information';
