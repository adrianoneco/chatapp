-- Add channel column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel TEXT;

-- Create index for channel lookups
CREATE INDEX IF NOT EXISTS idx_users_channel ON users(channel);
