import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table for chatbot customization
export const clients = pgTable("clients", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat sessions for persistence
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  sessionToken: text("session_token").notNull().unique(),
  phoneNumber: text("phone_number"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

// Chat messages for history
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").default(false),
  needsSupport: boolean("needs_support").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Custom responses for chatbots
export const customResponses = pgTable("custom_responses", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  keyword: text("keyword").notNull(),
  response: text("response").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support agents
export const supportAgents = pgTable("support_agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  isAvailable: boolean("is_available").default(true),
  lastActive: timestamp("last_active").defaultNow(),
});

// Support chats
export const supportChats = pgTable("support_chats", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  agentId: integer("agent_id").references(() => supportAgents.id),
  status: text("status").default("pending"), // pending, active, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Support messages
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => supportChats.id),
  senderId: integer("sender_id"), // can be user ID or null for client
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Statistics for dashboard
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  messageCount: integer("message_count").default(0),
  userCount: integer("user_count").default(0),
  supportRequestCount: integer("support_request_count").default(0),
  date: timestamp("date").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  category: true,
  logo: true,
  primaryColor: true,
  secondaryColor: true,
  chatTitle: true,
  welcomeMessage: true,
  userId: true,
});

export const insertCustomResponseSchema = createInsertSchema(customResponses).pick({
  clientId: true,
  keyword: true,
  response: true,
  isActive: true,
});

export const insertSupportAgentSchema = createInsertSchema(supportAgents).pick({
  userId: true,
  isAvailable: true,
});

export const insertSupportChatSchema = createInsertSchema(supportChats).pick({
  clientId: true,
  sessionId: true,
  agentId: true,
  status: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).pick({
  chatId: true,
  senderId: true,
  content: true,
  isRead: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  clientId: true,
  sessionToken: true,
  phoneNumber: true,
  expiresAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isUserMessage: true,
  needsSupport: true,
});

export const insertStatisticSchema = createInsertSchema(statistics).pick({
  clientId: true,
  messageCount: true,
  userCount: true,
  supportRequestCount: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertCustomResponse = z.infer<typeof insertCustomResponseSchema>;
export type InsertSupportAgent = z.infer<typeof insertSupportAgentSchema>;
export type InsertSupportChat = z.infer<typeof insertSupportChatSchema>;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertStatistic = z.infer<typeof insertStatisticSchema>;

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type CustomResponse = typeof customResponses.$inferSelect;
export type SupportAgent = typeof supportAgents.$inferSelect;
export type SupportChat = typeof supportChats.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Statistic = typeof statistics.$inferSelect;
