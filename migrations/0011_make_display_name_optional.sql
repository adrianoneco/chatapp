-- Make display_name optional in users table
ALTER TABLE "users" ALTER COLUMN "display_name" DROP NOT NULL;
