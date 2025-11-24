import { db } from "../server/db";
import { users, conversations, messages, messageReactions } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedConversations() {
  try {
    console.log("🌱 Starting conversation seeding...");

    // Get existing users
    const allUsers = await db.select().from(users);
    const clients = allUsers.filter(u => u.role === "client");
    const attendants = allUsers.filter(u => u.role === "attendant");

    if (clients.length === 0 || attendants.length === 0) {
      console.log("⚠️  Need at least one client and one attendant. Run seed-users.ts first.");
      return;
    }

    console.log(`Found ${clients.length} clients and ${attendants.length} attendants`);

    // Create conversations
    const conversationsData = [
      {
        protocol: `WEB-2024-${Date.now()}-001`,
        channel: "webchat" as const,
        clientId: clients[0].id,
        attendantId: attendants[0]?.id || null,
        status: "active" as const,
        clientIp: "177.45.123.89",
        clientLocation: "São Paulo, SP",
      },
      {
        protocol: `WEB-2024-${Date.now()}-002`,
        channel: "webchat" as const,
        clientId: clients[1]?.id || clients[0].id,
        attendantId: null,
        status: "waiting" as const,
        clientIp: "200.150.100.50",
        clientLocation: "Rio de Janeiro, RJ",
      },
    ];

    const createdConversations = await db
      .insert(conversations)
      .values(conversationsData)
      .returning();

    console.log(`✅ Created ${createdConversations.length} conversations`);

    // Create messages for first conversation
    if (createdConversations[0]) {
      const conv1 = createdConversations[0];
      const client = clients[0];
      const attendant = attendants[0];

      const messagesData = [
        {
          conversationId: conv1.id,
          senderId: client.id,
          content: "Olá! Preciso de ajuda com meu pedido.",
          type: "text" as const,
        },
        {
          conversationId: conv1.id,
          senderId: attendant?.id || client.id,
          content: "Olá! Claro, estou aqui para ajudar. Qual é o número do seu pedido?",
          type: "text" as const,
        },
        {
          conversationId: conv1.id,
          senderId: client.id,
          content: "É o pedido #12345",
          type: "text" as const,
        },
        {
          conversationId: conv1.id,
          senderId: attendant?.id || client.id,
          content: "Deixa eu verificar aqui para você...",
          type: "text" as const,
        },
        {
          conversationId: conv1.id,
          senderId: attendant?.id || client.id,
          content: "Encontrei! Seu pedido está em rota de entrega e deve chegar hoje até às 18h.",
          type: "text" as const,
        },
        {
          conversationId: conv1.id,
          senderId: client.id,
          content: "Ótimo! Muito obrigado pela ajuda! 🎉",
          type: "text" as const,
        },
      ];

      // Insert messages with delays to simulate real timestamps
      for (let i = 0; i < messagesData.length; i++) {
        const [message] = await db
          .insert(messages)
          .values(messagesData[i])
          .returning();
        
        console.log(`  ✓ Created message ${i + 1}/${messagesData.length}`);

        // Add some reactions to certain messages
        if (i === 0 || i === 5) {
          await db.insert(messageReactions).values({
            messageId: message.id,
            userId: attendant?.id || client.id,
            emoji: i === 0 ? "👋" : "❤️",
          });
        }
      }

      console.log(`✅ Created ${messagesData.length} messages with reactions`);
    }

    // Create a few messages for second conversation
    if (createdConversations[1] && clients[1]) {
      const conv2 = createdConversations[1];
      const client = clients[1];

      const messagesData = [
        {
          conversationId: conv2.id,
          senderId: client.id,
          content: "Olá, gostaria de informações sobre produtos.",
          type: "text" as const,
        },
        {
          conversationId: conv2.id,
          senderId: client.id,
          content: "Alguém pode me atender?",
          type: "text" as const,
        },
      ];

      await db.insert(messages).values(messagesData);
      console.log(`✅ Created ${messagesData.length} messages for waiting conversation`);
    }

    console.log("✅ Conversation seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding conversations:", error);
    throw error;
  }
}

// Run the seed
seedConversations()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
