CREATE TABLE IF NOT EXISTS "channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"color" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channels_slug_unique" UNIQUE("slug")
);

-- Insert default WebChat channel
INSERT INTO "channels" ("name", "slug", "icon", "color", "enabled", "is_default")
VALUES ('WebChat', 'webchat', '💬', '#3b82f6', true, true)
ON CONFLICT (slug) DO NOTHING;
