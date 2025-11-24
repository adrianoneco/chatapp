-- Create protocols table to manage unique protocols
CREATE TABLE IF NOT EXISTS protocols (
  id SERIAL PRIMARY KEY,
  protocol VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add sequence number to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sequence_number SERIAL;

-- Create index for faster protocol lookups
CREATE INDEX IF NOT EXISTS idx_protocols_protocol ON protocols(protocol);
CREATE INDEX IF NOT EXISTS idx_conversations_sequence ON conversations(sequence_number);
