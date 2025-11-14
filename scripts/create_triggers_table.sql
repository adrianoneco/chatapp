-- Create triggers_events table
CREATE TABLE IF NOT EXISTS triggers_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL,
  event text NOT NULL,
  description text,
  group_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Optional: unique constraint to avoid duplicate route/event
CREATE UNIQUE INDEX IF NOT EXISTS triggers_events_route_event_unique ON triggers_events (route, event);
