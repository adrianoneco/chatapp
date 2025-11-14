-- Add message status and deleted_by columns (idempotent)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by varchar;
ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS messages_deleted_by_fk FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Optional index to find deleted messages quickly
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
