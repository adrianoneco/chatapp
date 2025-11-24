-- Add deleted column to conversations table
ALTER TABLE "conversations" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;
