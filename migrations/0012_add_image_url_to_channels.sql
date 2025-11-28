-- Add imageUrl field to channels table
ALTER TABLE "channels" ADD COLUMN "image_url" text;

-- Remove icon and color columns as they will be replaced by image
-- Note: Keeping them for now for backward compatibility, can be removed later if needed
