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

export async function seedTestUsers() {
  if (process.env.NODE_ENV !== "development") {
    console.log("[seed] Skipping test users seed (not in development mode)");
    return;
  }

  try {
    const adminUsername = process.env.DEV_ADMIN_USERNAME || "admin";
    let admin = await storage.getUserByUsername(adminUsername);
    
    if (!admin) {
      const allUsers = await storage.getAllUsers();
      admin = allUsers.find(u => u.role === "admin");
      if (!admin) {
        console.log(`[seed] ⚠️ No admin user found, skipping test users seed`);
        return;
      }
      console.log(`[seed] Using existing admin: ${admin.username} (${admin.email})`);
    }

    const testAttendants = [
      { username: "maria.silva", email: "maria.silva@chatapp.local", name: "Maria Silva", password: "atendente123" },
      { username: "joao.santos", email: "joao.santos@chatapp.local", name: "João Santos", password: "atendente123" },
      { username: "ana.costa", email: "ana.costa@chatapp.local", name: "Ana Costa", password: "atendente123" },
    ];

    const testClients = [
      { name: "Carlos Eduardo", phone: "(11) 98765-4321", notes: "Cliente VIP - Interessado em produtos premium" },
      { name: "Beatriz Oliveira", phone: "(21) 99876-5432", notes: "Solicitou orçamento para serviços corporativos" },
      { name: "Pedro Henrique", phone: "(11) 97654-3210", notes: "Acompanhamento pós-venda" },
      { name: "Julia Martins", phone: "(19) 96543-2109", notes: "Primeira compra - enviar material de boas-vindas" },
      { name: "Roberto Almeida", phone: "(11) 95432-1098", notes: "Cliente recorrente - desconto especial aplicado" },
      { name: "Fernanda Lima", phone: "(21) 94321-0987", notes: "Aguardando aprovação de crédito" },
      { name: "Lucas Ferreira", phone: "(11) 93210-9876", notes: "Requer suporte técnico especializado" },
      { name: "Mariana Souza", phone: "(19) 92109-8765", notes: "Lead qualificado - agendar demonstração" },
    ];

    let createdAttendants = 0;
    let createdClients = 0;

    for (const attendant of testAttendants) {
      const existing = await storage.getUserByUsername(attendant.username);
      if (existing) {
        continue;
      }

      const hashedPassword = await hashPassword(attendant.password);
      await storage.createAttendant({
        name: attendant.name,
        username: attendant.username,
        email: attendant.email,
        password: hashedPassword,
      });
      createdAttendants++;
    }

    for (const client of testClients) {
      const existing = (await storage.getClients(admin.id)).find(c => c.name === client.name);
      if (existing) {
        continue;
      }

      await storage.createClient({
        name: client.name,
        phone: client.phone,
        notes: client.notes,
      }, admin.id);
      createdClients++;
    }

    if (createdAttendants > 0 || createdClients > 0) {
      console.log(`[seed] ✅ Created ${createdAttendants} attendants and ${createdClients} clients`);
      if (createdAttendants > 0) {
        console.log(`[seed] 📝 Attendant login: username='maria.silva' password='atendente123'`);
      }
    } else {
      console.log(`[seed] Test users already exist, skipping`);
    }
  } catch (error) {
    console.error("[seed] ❌ Failed to seed test users:", error);
  }
}
