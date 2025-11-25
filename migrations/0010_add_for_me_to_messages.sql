-- Add for_me column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS for_me BOOLEAN DEFAULT false;

-- Create index for for_me lookups
CREATE INDEX IF NOT EXISTS idx_messages_for_me ON messages(for_me);
