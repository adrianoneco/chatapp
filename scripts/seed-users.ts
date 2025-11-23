import { createUser, getUserByEmail } from "../server/auth";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const SAMPLE_USERS = [
  {
    email: "maria.client@example.com",
    password: "Client@123",
    displayName: "Maria Silva",
    role: "client" as const,
    phone: "(11) 98765-4321",
    avatarSeed: "maria-silva",
  },
  {
    email: "joao.client@example.com",
    password: "Client@456",
    displayName: "João Santos",
    role: "client" as const,
    phone: "(21) 99876-5432",
    avatarSeed: "joao-santos",
  },
  {
    email: "ana.client@example.com",
    password: "Client@789",
    displayName: "Ana Costa",
    role: "client" as const,
    phone: "(31) 98888-7777",
    avatarSeed: "ana-costa",
  },
  {
    email: "carlos.attendant@example.com",
    password: "Attendant@123",
    displayName: "Carlos Oliveira",
    role: "attendant" as const,
    phone: "(11) 97777-6666",
    avatarSeed: "carlos-oliveira",
  },
  {
    email: "julia.attendant@example.com",
    password: "Attendant@456",
    displayName: "Júlia Ferreira",
    role: "attendant" as const,
    phone: "(21) 96666-5555",
    avatarSeed: "julia-ferreira",
  },
  {
    email: "pedro.attendant@example.com",
    password: "Attendant@789",
    displayName: "Pedro Almeida",
    role: "attendant" as const,
    phone: "(31) 95555-4444",
    avatarSeed: "pedro-almeida",
  },
  {
    email: "admin.admin@example.com",
    password: "Admin@123",
    displayName: "Administrador Sistema",
    role: "admin" as const,
    phone: "(11) 94444-3333",
    avatarSeed: "admin-sistema",
  },
  {
    email: "lucia.admin@example.com",
    password: "Admin@456",
    displayName: "Lúcia Rodrigues",
    role: "admin" as const,
    phone: "(21) 93333-2222",
    avatarSeed: "lucia-rodrigues",
  },
  {
    email: "roberto.admin@example.com",
    password: "Admin@789",
    displayName: "Roberto Lima",
    role: "admin" as const,
    phone: "(31) 92222-1111",
    avatarSeed: "roberto-lima",
  },
];

async function seedUsers() {
  console.log("🌱 Starting user seeding...\n");

  let created = 0;
  let skipped = 0;

  for (const userData of SAMPLE_USERS) {
    const existingUser = await getUserByEmail(userData.email);

    if (existingUser) {
      console.log(`⏭️  Skipping ${userData.email} (already exists)`);
      skipped++;
      continue;
    }

    const user = await createUser(
      userData.email,
      userData.password,
      userData.displayName,
      userData.role
    );

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.avatarSeed}`;

    await db
      .update(users)
      .set({
        avatarUrl,
        phone: userData.phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`✅ Created ${userData.role.toUpperCase()}: ${userData.displayName} (${userData.email})`);
    created++;
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Created: ${created} users`);
  console.log(`   Skipped: ${skipped} users (already existed)`);
  console.log(`\n📋 Sample Credentials:`);
  console.log(`   Clients:`);
  console.log(`   - maria.client@example.com / Client@123`);
  console.log(`   - joao.client@example.com / Client@456`);
  console.log(`   - ana.client@example.com / Client@789`);
  console.log(`   Attendants:`);
  console.log(`   - carlos.attendant@example.com / Attendant@123`);
  console.log(`   - julia.attendant@example.com / Attendant@456`);
  console.log(`   - pedro.attendant@example.com / Attendant@789`);
  console.log(`   Admins:`);
  console.log(`   - admin.admin@example.com / Admin@123`);
  console.log(`   - lucia.admin@example.com / Admin@456`);
  console.log(`   - roberto.admin@example.com / Admin@789`);

  process.exit(0);
}

seedUsers().catch((error) => {
  console.error("❌ Error seeding users:", error);
  process.exit(1);
});
