-- Remove icon and color columns from channels table as they are replaced by imageUrl
ALTER TABLE "channels" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "channels" DROP COLUMN IF EXISTS "color";
