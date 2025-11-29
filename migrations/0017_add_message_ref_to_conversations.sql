-- Add message_ref field to conversations table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "message_ref" text;
