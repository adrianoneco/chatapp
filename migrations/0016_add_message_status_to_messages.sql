-- Add message_status field to messages table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "message_status" text DEFAULT 'sent' NOT NULL;
