-- Add remote_jid column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS remote_jid TEXT;

-- Create index for remote_jid lookups
CREATE INDEX IF NOT EXISTS idx_users_remote_jid ON users(remote_jid);
