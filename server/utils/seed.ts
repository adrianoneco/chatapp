import { storage } from "../storage";
import { hashPassword } from "./auth";

export async function seedDevAdmin() {
  if (process.env.NODE_ENV !== "development") {
    console.log("[seed] Skipping dev admin seed (not in development mode)");
    return;
  }

  const username = process.env.DEV_ADMIN_USERNAME || "admin";
  const email = process.env.DEV_ADMIN_EMAIL || "admin@chatapp.local";
  const password = process.env.DEV_ADMIN_PASSWORD || "admin123";
  const name = process.env.DEV_ADMIN_NAME || "Admin ChatApp";

  try {
    const existingByUsername = await storage.getUserByUsername(username);
    const existingByEmail = await storage.getUserByEmail(email);
    
    if (existingByUsername || existingByEmail) {
      const existing = existingByUsername || existingByEmail;
      console.log(`[seed] Admin user already exists: ${existing!.username} (${existing!.email}), skipping seed`);
      console.log(`[seed] ⚠️  Note: Stored password may differ from DEV_ADMIN_PASSWORD environment variable`);
      return;
    }

    const hashedPassword = await hashPassword(password);
    const admin = await storage.createUser({
      name,
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`[seed] ✅ Created admin user: ${admin.username} (${admin.email})`);
    console.log(`[seed] 📝 Login with username='${admin.username}' password='${password}'`);
  } catch (error) {
    console.error("[seed] ❌ Failed to seed admin user:", error);
  }
}
