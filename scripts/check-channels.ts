import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { channels } from "../shared/schema.js";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const db = drizzle(pool);

async function checkChannels() {
  try {
    const result = await db.select().from(channels);
    console.log("Canais encontrados:", result.length);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.length === 0) {
      console.log("\n⚠️ Nenhum canal encontrado. Criando canal padrão...");
      
      const [newChannel] = await db.insert(channels).values({
        name: "WebChat",
        slug: "webchat",
        enabled: true,
        isDefault: true,
      }).returning();
      
      console.log("✅ Canal padrão criado:", newChannel);
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    await pool.end();
  }
}

checkChannels();
