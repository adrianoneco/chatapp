-- Add locked field to channels table
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "locked" boolean DEFAULT false NOT NULL;
