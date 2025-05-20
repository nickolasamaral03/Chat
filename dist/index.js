var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

// server/storage.ts
import { randomUUID } from "crypto";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  chatSessions: () => chatSessions,
  clients: () => clients,
  customResponses: () => customResponses,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertChatSessionSchema: () => insertChatSessionSchema,
  insertClientSchema: () => insertClientSchema,
  insertCustomResponseSchema: () => insertCustomResponseSchema,
  insertStatisticSchema: () => insertStatisticSchema,
  insertSupportAgentSchema: () => insertSupportAgentSchema,
  insertSupportChatSchema: () => insertSupportChatSchema,
  insertSupportMessageSchema: () => insertSupportMessageSchema,
  insertUserSchema: () => insertUserSchema,
  statistics: () => statistics,
  supportAgents: () => supportAgents,
  supportChats: () => supportChats,
  supportMessages: () => supportMessages,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  logo: text("logo"),
  isActive: boolean("is_active").default(true),
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#10B981"),
  chatTitle: text("chat_title").notNull(),
  welcomeMessage: text("welcome_message").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  sessionToken: text("session_token").notNull().unique(),
  phoneNumber: text("phone_number"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").default(false),
  needsSupport: boolean("needs_support").default(false),
  timestamp: timestamp("timestamp").defaultNow()
});
var customResponses = pgTable("custom_responses", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  keyword: text("keyword").notNull(),
  response: text("response").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var supportAgents = pgTable("support_agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  isAvailable: boolean("is_available").default(true),
  lastActive: timestamp("last_active").defaultNow()
});
var supportChats = pgTable("support_chats", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  agentId: integer("agent_id").references(() => supportAgents.id),
  status: text("status").default("pending"),
  // pending, active, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});
var supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => supportChats.id),
  senderId: integer("sender_id"),
  // can be user ID or null for client
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow()
});
var statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  messageCount: integer("message_count").default(0),
  userCount: integer("user_count").default(0),
  supportRequestCount: integer("support_request_count").default(0),
  date: timestamp("date").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true
});
var insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  category: true,
  logo: true,
  primaryColor: true,
  secondaryColor: true,
  chatTitle: true,
  welcomeMessage: true,
  userId: true
});
var insertCustomResponseSchema = createInsertSchema(customResponses).pick({
  clientId: true,
  keyword: true,
  response: true,
  isActive: true
});
var insertSupportAgentSchema = createInsertSchema(supportAgents).pick({
  userId: true,
  isAvailable: true
});
var insertSupportChatSchema = createInsertSchema(supportChats).pick({
  clientId: true,
  sessionId: true,
  agentId: true,
  status: true
});
var insertSupportMessageSchema = createInsertSchema(supportMessages).pick({
  chatId: true,
  senderId: true,
  content: true,
  isRead: true
});
var insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  clientId: true,
  sessionToken: true,
  phoneNumber: true,
  expiresAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isUserMessage: true,
  needsSupport: true
});
var insertStatisticSchema = createInsertSchema(statistics).pick({
  clientId: true,
  messageCount: true,
  userCount: true,
  supportRequestCount: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async createUser(user) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(users).values({
      ...user,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  // Client operations
  async getAllClients() {
    return db.select().from(clients);
  }
  async getClientById(id) {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }
  async createClient(client) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(clients).values({
      ...client,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    const newClient = result[0];
    await this.createStatistic({
      clientId: newClient.id,
      messageCount: 0,
      userCount: 0,
      supportRequestCount: 0
    });
    return newClient;
  }
  async updateClient(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(clients).set({ ...updates, updatedAt: now }).where(eq(clients.id, id)).returning();
    return result[0];
  }
  async deleteClient(id) {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }
  // Custom Response operations
  async getCustomResponsesByClientId(clientId) {
    return db.select().from(customResponses).where(eq(customResponses.clientId, clientId));
  }
  async createCustomResponse(response) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(customResponses).values({
      ...response,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  async updateCustomResponse(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(customResponses).set({ ...updates, updatedAt: now }).where(eq(customResponses.id, id)).returning();
    return result[0];
  }
  async deleteCustomResponse(id) {
    const result = await db.delete(customResponses).where(eq(customResponses.id, id)).returning();
    return result.length > 0;
  }
  // Support operations
  async getSupportAgents() {
    return db.select().from(supportAgents);
  }
  async getSupportAgent(id) {
    const result = await db.select().from(supportAgents).where(eq(supportAgents.id, id));
    return result[0];
  }
  async createSupportAgent(agent) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(supportAgents).values({
      ...agent,
      isAvailable: true,
      lastActive: now
    }).returning();
    return result[0];
  }
  async updateSupportAgent(id, updates) {
    const result = await db.update(supportAgents).set(updates).where(eq(supportAgents.id, id)).returning();
    return result[0];
  }
  // Support chat operations
  async getSupportChatsByClientId(clientId) {
    return db.select().from(supportChats).where(eq(supportChats.clientId, clientId));
  }
  async getSupportChatsByAgentId(agentId) {
    return db.select().from(supportChats).where(eq(supportChats.agentId, agentId));
  }
  async getSupportChat(id) {
    const result = await db.select().from(supportChats).where(eq(supportChats.id, id));
    return result[0];
  }
  async createSupportChat(chat) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(supportChats).values({
      ...chat,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  async updateSupportChat(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(supportChats).set({ ...updates, updatedAt: now }).where(eq(supportChats.id, id)).returning();
    return result[0];
  }
  // Support message operations
  async getSupportMessagesByChatId(chatId) {
    return db.select().from(supportMessages).where(eq(supportMessages.chatId, chatId)).orderBy(supportMessages.timestamp);
  }
  async createSupportMessage(message) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(supportMessages).values({
      ...message,
      isRead: false,
      timestamp: now
    }).returning();
    await db.update(supportChats).set({ updatedAt: now }).where(eq(supportChats.id, message.chatId));
    return result[0];
  }
  async markSupportMessagesAsRead(chatId, userId) {
    await db.update(supportMessages).set({ isRead: true }).where(eq(supportMessages.chatId, chatId));
  }
  // Chat session operations
  async createChatSession(session) {
    const sessionToken = session.sessionToken || randomUUID();
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(chatSessions).values({
      ...session,
      sessionToken,
      createdAt: now,
      lastActive: now
    }).returning();
    const newSession = result[0];
    if (newSession.clientId) {
      await this.incrementUserCount(newSession.clientId);
    }
    return newSession;
  }
  async getChatSession(id) {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return result[0];
  }
  async getChatSessionByToken(token) {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.sessionToken, token));
    return result[0];
  }
  async getChatSessionsByClientId(clientId) {
    return db.select().from(chatSessions).where(eq(chatSessions.clientId, clientId));
  }
  async updateChatSession(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(chatSessions).set({ ...updates, lastActive: now }).where(eq(chatSessions.id, id)).returning();
    return result[0];
  }
  // Chat message operations
  async getChatMessagesBySessionId(sessionId) {
    return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.timestamp);
  }
  async createChatMessage(message) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(chatMessages).values({
      ...message,
      timestamp: now
    }).returning();
    const newMessage = result[0];
    if (newMessage.sessionId) {
      await db.update(chatSessions).set({ lastActive: now }).where(eq(chatSessions.id, newMessage.sessionId));
      const sessionResult = await db.select().from(chatSessions).where(eq(chatSessions.id, newMessage.sessionId));
      const session = sessionResult[0];
      if (session && session.clientId) {
        await this.incrementMessageCount(session.clientId);
        if (newMessage.needsSupport) {
          await this.incrementSupportRequestCount(session.clientId);
        }
      }
    }
    return newMessage;
  }
  // Statistics operations
  async createStatistic(stat) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.insert(statistics).values({
      ...stat,
      date: now
    }).returning();
    return result[0];
  }
  async getStatisticsByClientId(clientId) {
    return db.select().from(statistics).where(eq(statistics.clientId, clientId)).orderBy(statistics.date, "desc");
  }
  async incrementMessageCount(clientId) {
    const stats = await this.getStatisticsByClientId(clientId);
    if (stats.length > 0) {
      const latestStat = stats[0];
      const messageCount = (latestStat.messageCount || 0) + 1;
      await db.update(statistics).set({ messageCount }).where(eq(statistics.id, latestStat.id));
    }
  }
  async incrementUserCount(clientId) {
    const stats = await this.getStatisticsByClientId(clientId);
    if (stats.length > 0) {
      const latestStat = stats[0];
      const userCount = (latestStat.userCount || 0) + 1;
      await db.update(statistics).set({ userCount }).where(eq(statistics.id, latestStat.id));
    }
  }
  async incrementSupportRequestCount(clientId) {
    const stats = await this.getStatisticsByClientId(clientId);
    if (stats.length > 0) {
      const latestStat = stats[0];
      const supportRequestCount = (latestStat.supportRequestCount || 0) + 1;
      await db.update(statistics).set({ supportRequestCount }).where(eq(statistics.id, latestStat.id));
    }
  }
  async getDashboardStats() {
    const clientsResult = await db.select().from(clients);
    const totalBots = clientsResult.length;
    const statsResult = await db.select().from(statistics);
    let messagesToday = 0;
    let activeUsers = 0;
    let supportRequests = 0;
    for (const stat of statsResult) {
      messagesToday += stat.messageCount || 0;
      activeUsers += stat.userCount || 0;
      supportRequests += stat.supportRequestCount || 0;
    }
    return {
      totalBots,
      messagesToday,
      activeUsers,
      supportRequests
    };
  }
};
var storage = new DatabaseStorage();

// server/initDb.ts
import { hash } from "bcrypt";
import { randomUUID as randomUUID2 } from "crypto";
async function initDb() {
  try {
    console.log("Initializing database...");
    const hashedPassword = await hash("admin123", 10);
    const now = /* @__PURE__ */ new Date();
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      createdAt: now,
      updatedAt: now
    }).returning();
    console.log("Created admin user:", adminUser.id);
    const [agent] = await db.insert(supportAgents).values({
      userId: adminUser.id,
      isAvailable: true,
      lastActive: now
    }).returning();
    console.log("Created support agent:", agent.id);
    const [lojaConceito] = await db.insert(clients).values({
      name: "Loja Conceito",
      category: "E-commerce",
      logo: "",
      isActive: true,
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      chatTitle: "Atendimento Loja Conceito",
      welcomeMessage: "Ol\xE1! Bem-vindo \xE0 Loja Conceito. Como posso ajudar voc\xEA hoje?",
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    const [restaurante] = await db.insert(clients).values({
      name: "Restaurante Sabor",
      category: "Alimenta\xE7\xE3o",
      logo: "",
      isActive: true,
      primaryColor: "#10B981",
      secondaryColor: "#3B82F6",
      chatTitle: "Atendimento Restaurante Sabor",
      welcomeMessage: "Ol\xE1! Bem-vindo ao Restaurante Sabor. Como posso ajudar voc\xEA hoje?",
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    const [clinica] = await db.insert(clients).values({
      name: "Cl\xEDnica Bem-Estar",
      category: "Sa\xFAde",
      logo: "",
      isActive: true,
      primaryColor: "#8B5CF6",
      secondaryColor: "#3B82F6",
      chatTitle: "Atendimento Cl\xEDnica Bem-Estar",
      welcomeMessage: "Ol\xE1! Bem-vindo \xE0 Cl\xEDnica Bem-Estar. Como posso ajudar voc\xEA hoje?",
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    console.log("Created sample clients");
    await db.insert(customResponses).values([
      {
        clientId: lojaConceito.id,
        keyword: "horario",
        response: "Nosso hor\xE1rio de funcionamento \xE9 de segunda a sexta, das 9h \xE0s 18h, e aos s\xE1bados das 9h \xE0s 13h.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: lojaConceito.id,
        keyword: "entrega",
        response: "Realizamos entregas para todo o Brasil. O prazo m\xE9dio \xE9 de 3 a 5 dias \xFAteis, dependendo da sua localiza\xE7\xE3o.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: restaurante.id,
        keyword: "reserva",
        response: "Para fazer uma reserva, por favor informe a data, hor\xE1rio e n\xFAmero de pessoas. Teremos prazer em atend\xEA-lo!",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clinica.id,
        keyword: "agendamento",
        response: "Para agendar uma consulta, por favor informe a especialidade m\xE9dica desejada e suas prefer\xEAncias de data e hor\xE1rio.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
    console.log("Created sample custom responses");
    await db.insert(statistics).values([
      {
        clientId: lojaConceito.id,
        messageCount: 243,
        userCount: 18,
        supportRequestCount: 8,
        date: now
      },
      {
        clientId: restaurante.id,
        messageCount: 187,
        userCount: 24,
        supportRequestCount: 5,
        date: now
      },
      {
        clientId: clinica.id,
        messageCount: 98,
        userCount: 12,
        supportRequestCount: 3,
        date: now
      }
    ]);
    console.log("Created sample statistics");
    const [session1] = await db.insert(chatSessions).values({
      clientId: lojaConceito.id,
      sessionToken: randomUUID2(),
      phoneNumber: null,
      expiresAt: null,
      createdAt: now,
      lastActive: now
    }).returning();
    console.log("Created sample chat session");
    await db.insert(chatMessages).values([
      {
        sessionId: session1.id,
        content: "Ol\xE1! Bem-vindo \xE0 Loja Conceito. Como posso ajudar voc\xEA hoje?",
        isUserMessage: false,
        needsSupport: false,
        timestamp: now
      },
      {
        sessionId: session1.id,
        content: "Ol\xE1, quero saber sobre o hor\xE1rio de funcionamento",
        isUserMessage: true,
        needsSupport: false,
        timestamp: new Date(now.getTime() + 3e4)
      },
      {
        sessionId: session1.id,
        content: "Nosso hor\xE1rio de funcionamento \xE9 de segunda a sexta, das 9h \xE0s 18h, e aos s\xE1bados das 9h \xE0s 13h.",
        isUserMessage: false,
        needsSupport: false,
        timestamp: new Date(now.getTime() + 35e3)
      }
    ]);
    console.log("Created sample chat messages");
    const [supportChat] = await db.insert(supportChats).values({
      clientId: lojaConceito.id,
      sessionId: session1.id,
      agentId: agent.id,
      status: "active",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null
    }).returning();
    await db.insert(supportMessages).values([
      {
        chatId: supportChat.id,
        senderId: null,
        // From client
        content: "Preciso de ajuda para encontrar um produto espec\xEDfico",
        isRead: true,
        timestamp: new Date(now.getTime() + 6e4)
      },
      {
        chatId: supportChat.id,
        senderId: adminUser.id,
        // From admin
        content: "Ol\xE1! Ficarei feliz em ajudar. Qual produto voc\xEA est\xE1 procurando?",
        isRead: true,
        timestamp: new Date(now.getTime() + 65e3)
      },
      {
        chatId: supportChat.id,
        senderId: null,
        // From client
        content: "Estou procurando o t\xEAnis modelo Runner na cor azul",
        isRead: true,
        timestamp: new Date(now.getTime() + 9e4)
      },
      {
        chatId: supportChat.id,
        senderId: adminUser.id,
        // From admin
        content: "Vou verificar a disponibilidade para voc\xEA. Um momento, por favor.",
        isRead: true,
        timestamp: new Date(now.getTime() + 1e5)
      }
    ]);
    console.log("Created sample support chat and messages");
    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// server/routes.ts
import { randomUUID as randomUUID3 } from "crypto";
import { z } from "zod";
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2) => {
    console.log("WebSocket client connected");
    ws2.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "join_support_chat") {
          ws2.chatId = data.chatId;
          ws2.userId = data.userId;
          console.log(`User joined support chat: ${data.chatId}`);
        } else if (data.type === "support_message" && data.chatId && data.content) {
          const newMessage = await storage.createSupportMessage({
            chatId: data.chatId,
            senderId: data.userId || null,
            content: data.content,
            isRead: false
          });
          wss.clients.forEach((client) => {
            if (client.chatId === data.chatId && client.readyState === ws2.OPEN) {
              client.send(JSON.stringify({
                type: "support_message",
                message: newMessage
              }));
            }
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });
    ws2.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  const apiRouter = express.Router();
  apiRouter.post("/init-db", async (req, res) => {
    try {
      await initDb();
      res.json({ message: "Database initialized successfully" });
    } catch (error) {
      console.error("Failed to initialize database:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });
  apiRouter.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      const agents = await storage.getSupportAgents();
      const agent = agents.find((a) => a.userId === user.id);
      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        },
        agentId: agent?.id
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  apiRouter.get("/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });
  apiRouter.get("/clients", async (req, res) => {
    try {
      const clients2 = await storage.getAllClients();
      const clientsWithStats = await Promise.all(
        clients2.map(async (client) => {
          const stats = await storage.getStatisticsByClientId(client.id);
          const latestStat = stats[0] || { messageCount: 0, userCount: 0, supportRequestCount: 0 };
          return {
            ...client,
            messageCount: latestStat.messageCount || 0,
            userCount: latestStat.userCount || 0,
            supportRequestCount: latestStat.supportRequestCount || 0
          };
        })
      );
      res.json(clientsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  apiRouter.get("/clients/:id", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });
  apiRouter.post("/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  apiRouter.put("/clients/:id", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const validatedData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(clientId, validatedData);
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  apiRouter.delete("/clients/:id", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const result = await storage.deleteClient(clientId);
      if (!result) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });
  apiRouter.get("/responses/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const responses = await storage.getCustomResponsesByClientId(clientId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom responses" });
    }
  });
  apiRouter.post("/responses", async (req, res) => {
    try {
      const validatedData = insertCustomResponseSchema.parse(req.body);
      const response = await storage.createCustomResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create custom response" });
    }
  });
  apiRouter.put("/responses/:id", async (req, res) => {
    try {
      const responseId = parseInt(req.params.id);
      const validatedData = insertCustomResponseSchema.partial().parse(req.body);
      const updatedResponse = await storage.updateCustomResponse(responseId, validatedData);
      if (!updatedResponse) {
        return res.status(404).json({ message: "Custom response not found" });
      }
      res.json(updatedResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update custom response" });
    }
  });
  apiRouter.delete("/responses/:id", async (req, res) => {
    try {
      const responseId = parseInt(req.params.id);
      const result = await storage.deleteCustomResponse(responseId);
      if (!result) {
        return res.status(404).json({ message: "Custom response not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete custom response" });
    }
  });
  apiRouter.get("/agents", async (req, res) => {
    try {
      const agents = await storage.getSupportAgents();
      const agentsWithUserInfo = await Promise.all(
        agents.map(async (agent) => {
          const user = await storage.getUser(agent.userId);
          return {
            ...agent,
            user: user ? {
              id: user.id,
              username: user.username,
              name: user.name,
              email: user.email,
              role: user.role
            } : null
          };
        })
      );
      res.json(agentsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support agents" });
    }
  });
  apiRouter.get("/support/chats", async (req, res) => {
    try {
      let chats;
      if (req.query.agentId) {
        const agentId = parseInt(req.query.agentId);
        chats = await storage.getSupportChatsByAgentId(agentId);
      } else if (req.query.clientId) {
        const clientId = parseInt(req.query.clientId);
        chats = await storage.getSupportChatsByClientId(clientId);
      } else {
        return res.status(400).json({ message: "Either agentId or clientId is required" });
      }
      const chatsWithInfo = await Promise.all(
        chats.map(async (chat) => {
          const client = await storage.getClientById(chat.clientId);
          const session = chat.sessionId ? await storage.getChatSession(chat.sessionId) : null;
          return {
            ...chat,
            client,
            session
          };
        })
      );
      res.json(chatsWithInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support chats" });
    }
  });
  apiRouter.get("/support/chats/:id", async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getSupportChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Support chat not found" });
      }
      const client = await storage.getClientById(chat.clientId);
      const session = chat.sessionId ? await storage.getChatSession(chat.sessionId) : null;
      const messages = await storage.getSupportMessagesByChatId(chatId);
      res.json({
        chat: {
          ...chat,
          client,
          session
        },
        messages
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support chat" });
    }
  });
  apiRouter.post("/support/chats", async (req, res) => {
    try {
      const validatedData = insertSupportChatSchema.parse(req.body);
      const chat = await storage.createSupportChat(validatedData);
      res.status(201).json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create support chat" });
    }
  });
  apiRouter.put("/support/chats/:id", async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const validatedData = insertSupportChatSchema.partial().parse(req.body);
      const updatedChat = await storage.updateSupportChat(chatId, validatedData);
      if (!updatedChat) {
        return res.status(404).json({ message: "Support chat not found" });
      }
      res.json(updatedChat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update support chat" });
    }
  });
  apiRouter.get("/support/messages/:chatId", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await storage.getSupportMessagesByChatId(chatId);
      if (req.query.userId) {
        const userId = parseInt(req.query.userId);
        await storage.markSupportMessagesAsRead(chatId, userId);
      }
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support messages" });
    }
  });
  apiRouter.post("/support/messages", async (req, res) => {
    try {
      const validatedData = insertSupportMessageSchema.parse(req.body);
      const message = await storage.createSupportMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create support message" });
    }
  });
  apiRouter.post("/chat/sessions", async (req, res) => {
    try {
      const validatedData = insertChatSessionSchema.parse({
        ...req.body,
        sessionToken: randomUUID3()
      });
      const session = await storage.createChatSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });
  apiRouter.get("/chat/sessions/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const session = await storage.getChatSessionByToken(token);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const messages = await storage.getChatMessagesBySessionId(session.id);
      res.json({
        session,
        messages
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });
  apiRouter.post("/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      let needsSupport = false;
      if (validatedData.isUserMessage && validatedData.sessionId) {
        const session = await storage.getChatSession(validatedData.sessionId);
        if (session && session.clientId) {
          const clientResponses = await storage.getCustomResponsesByClientId(session.clientId);
          const content = validatedData.content.toLowerCase();
          const matchingResponse = clientResponses.find(
            (response) => response.isActive && content.includes(response.keyword.toLowerCase())
          );
          if (!matchingResponse) {
            needsSupport = true;
          }
        }
      }
      const message = await storage.createChatMessage({
        ...validatedData,
        needsSupport
      });
      if (needsSupport && message.sessionId) {
        const session = await storage.getChatSession(message.sessionId);
        if (session && session.clientId) {
          const agents = await storage.getSupportAgents();
          const availableAgent = agents.find((agent) => agent.isAvailable);
          if (availableAgent) {
            const supportChat = await storage.createSupportChat({
              clientId: session.clientId,
              sessionId: message.sessionId,
              agentId: availableAgent.id,
              status: "pending"
            });
            await storage.createSupportMessage({
              chatId: supportChat.id,
              senderId: null,
              // From client
              content: validatedData.content,
              isRead: false
            });
          }
        }
      }
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });
  apiRouter.get("/chat/messages/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessagesBySessionId(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  apiRouter.post("/qr/generate", async (req, res) => {
    try {
      const { clientId, sessionTimeout, phoneNumber } = req.body;
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }
      let expiresAt = null;
      if (sessionTimeout === "24h") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      } else if (sessionTimeout === "7d") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
      }
      const session = await storage.createChatSession({
        clientId: parseInt(clientId),
        sessionToken: randomUUID3(),
        phoneNumber: phoneNumber || void 0,
        expiresAt: expiresAt || void 0
      });
      res.status(201).json({
        session,
        qrUrl: `${req.protocol}://${req.get("host")}/chat/${session.sessionToken}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code session" });
    }
  });
  app2.use("/api", apiRouter);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
var vite_config_default = defineConfig({
  root: "client",
  // Set the root to the client directory
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src")
    }
  },
  server: {
    port: 3e3
  },
  build: {
    outDir: "../dist/client"
    // Adjust output directory relative to new root
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
