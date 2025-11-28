-- Add description field to channels table
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "description" text;
