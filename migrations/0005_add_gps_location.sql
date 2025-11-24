-- Add GPS location fields to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS gps_location BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS longitude REAL;
