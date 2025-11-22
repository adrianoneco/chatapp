import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'client',
        deleted BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create password_reset_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    // Create index on deleted for faster filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted)
    `);

    // Create index on role for faster filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);

    await client.query("COMMIT");
    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}
