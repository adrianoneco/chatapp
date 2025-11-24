-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('none', 'apikey', 'bearer', 'basic')),
  auth_config JSONB,
  headers JSONB DEFAULT '{}',
  events JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id VARCHAR NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
