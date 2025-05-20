import { randomUUID } from 'crypto';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { 
  users, clients, chatSessions, chatMessages, statistics,
  customResponses, supportAgents, supportChats, supportMessages,
  type User, type Client, type ChatSession, type ChatMessage, type Statistic,
  type CustomResponse, type SupportAgent, type SupportChat, type SupportMessage,
  type InsertUser, type InsertClient, type InsertChatSession, type InsertChatMessage, type InsertStatistic,
  type InsertCustomResponse, type InsertSupportAgent, type InsertSupportChat, type InsertSupportMessage
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client operations
  getAllClients(): Promise<Client[]>;
  getClientById(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Custom Response operations
  getCustomResponsesByClientId(clientId: number): Promise<CustomResponse[]>;
  createCustomResponse(response: InsertCustomResponse): Promise<CustomResponse>;
  updateCustomResponse(id: number, updates: Partial<InsertCustomResponse>): Promise<CustomResponse | undefined>;
  deleteCustomResponse(id: number): Promise<boolean>;
  
  // Support operations
  getSupportAgents(): Promise<SupportAgent[]>;
  getSupportAgent(id: number): Promise<SupportAgent | undefined>;
  createSupportAgent(agent: InsertSupportAgent): Promise<SupportAgent>;
  updateSupportAgent(id: number, updates: Partial<InsertSupportAgent>): Promise<SupportAgent | undefined>;
  
  // Support chat operations
  getSupportChatsByClientId(clientId: number): Promise<SupportChat[]>;
  getSupportChatsByAgentId(agentId: number): Promise<SupportChat[]>;
  getSupportChat(id: number): Promise<SupportChat | undefined>;
  createSupportChat(chat: InsertSupportChat): Promise<SupportChat>;
  updateSupportChat(id: number, updates: Partial<InsertSupportChat>): Promise<SupportChat | undefined>;
  
  // Support message operations
  getSupportMessagesByChatId(chatId: number): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  markSupportMessagesAsRead(chatId: number, userId: number): Promise<void>;
  
  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionByToken(token: string): Promise<ChatSession | undefined>;
  getChatSessionsByClientId(clientId: number): Promise<ChatSession[]>;
  updateChatSession(id: number, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined>;
  
  // Chat message operations
  getChatMessagesBySessionId(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Statistics operations
  getStatisticsByClientId(clientId: number): Promise<Statistic[]>;
  incrementMessageCount(clientId: number): Promise<void>;
  incrementUserCount(clientId: number): Promise<void>;
  incrementSupportRequestCount(clientId: number): Promise<void>;
  getDashboardStats(): Promise<{ totalBots: number; messagesToday: number; activeUsers: number; supportRequests: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const result = await db.insert(users).values({
      ...user,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }

  // Client operations
  async getAllClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const now = new Date();
    const result = await db.insert(clients).values({
      ...client,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    const newClient = result[0];
    
    // Initialize statistics for this client
    await this.createStatistic({
      clientId: newClient.id,
      messageCount: 0,
      userCount: 0,
      supportRequestCount: 0
    });
    
    return newClient;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const now = new Date();
    const result = await db.update(clients)
      .set({ ...updates, updatedAt: now })
      .where(eq(clients.id, id))
      .returning();
    
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }
  
  // Custom Response operations
  async getCustomResponsesByClientId(clientId: number): Promise<CustomResponse[]> {
    return db.select().from(customResponses).where(eq(customResponses.clientId, clientId));
  }
  
  async createCustomResponse(response: InsertCustomResponse): Promise<CustomResponse> {
    const now = new Date();
    const result = await db.insert(customResponses).values({
      ...response,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return result[0];
  }
  
  async updateCustomResponse(id: number, updates: Partial<InsertCustomResponse>): Promise<CustomResponse | undefined> {
    const now = new Date();
    const result = await db.update(customResponses)
      .set({ ...updates, updatedAt: now })
      .where(eq(customResponses.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteCustomResponse(id: number): Promise<boolean> {
    const result = await db.delete(customResponses).where(eq(customResponses.id, id)).returning();
    return result.length > 0;
  }
  
  // Support operations
  async getSupportAgents(): Promise<SupportAgent[]> {
    return db.select().from(supportAgents);
  }
  
  async getSupportAgent(id: number): Promise<SupportAgent | undefined> {
    const result = await db.select().from(supportAgents).where(eq(supportAgents.id, id));
    return result[0];
  }
  
  async createSupportAgent(agent: InsertSupportAgent): Promise<SupportAgent> {
    const now = new Date();
    const result = await db.insert(supportAgents).values({
      ...agent,
      isAvailable: true,
      lastActive: now
    }).returning();
    
    return result[0];
  }
  
  async updateSupportAgent(id: number, updates: Partial<InsertSupportAgent>): Promise<SupportAgent | undefined> {
    const result = await db.update(supportAgents)
      .set(updates)
      .where(eq(supportAgents.id, id))
      .returning();
    
    return result[0];
  }
  
  // Support chat operations
  async getSupportChatsByClientId(clientId: number): Promise<SupportChat[]> {
    return db.select().from(supportChats).where(eq(supportChats.clientId, clientId));
  }
  
  async getSupportChatsByAgentId(agentId: number): Promise<SupportChat[]> {
    return db.select().from(supportChats).where(eq(supportChats.agentId, agentId));
  }
  
  async getSupportChat(id: number): Promise<SupportChat | undefined> {
    const result = await db.select().from(supportChats).where(eq(supportChats.id, id));
    return result[0];
  }
  
  async createSupportChat(chat: InsertSupportChat): Promise<SupportChat> {
    const now = new Date();
    const result = await db.insert(supportChats).values({
      ...chat,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return result[0];
  }
  
  async updateSupportChat(id: number, updates: Partial<InsertSupportChat>): Promise<SupportChat | undefined> {
    const now = new Date();
    const result = await db.update(supportChats)
      .set({ ...updates, updatedAt: now })
      .where(eq(supportChats.id, id))
      .returning();
    
    return result[0];
  }
  
  // Support message operations
  async getSupportMessagesByChatId(chatId: number): Promise<SupportMessage[]> {
    return db.select().from(supportMessages)
      .where(eq(supportMessages.chatId, chatId))
      .orderBy(supportMessages.timestamp);
  }
  
  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const now = new Date();
    const result = await db.insert(supportMessages).values({
      ...message,
      isRead: false,
      timestamp: now
    }).returning();
    
    // Update the related support chat
    await db.update(supportChats)
      .set({ updatedAt: now })
      .where(eq(supportChats.id, message.chatId));
    
    return result[0];
  }
  
  async markSupportMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db.update(supportMessages)
      .set({ isRead: true })
      .where(eq(supportMessages.chatId, chatId));
  }

  // Chat session operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const sessionToken = session.sessionToken || randomUUID();
    const now = new Date();
    
    const result = await db.insert(chatSessions).values({
      ...session,
      sessionToken,
      createdAt: now,
      lastActive: now
    }).returning();
    
    const newSession = result[0];
    
    // Increment user count for this client
    if (newSession.clientId) {
      await this.incrementUserCount(newSession.clientId);
    }
    
    return newSession;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return result[0];
  }

  async getChatSessionByToken(token: string): Promise<ChatSession | undefined> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.sessionToken, token));
    return result[0];
  }

  async getChatSessionsByClientId(clientId: number): Promise<ChatSession[]> {
    return db.select().from(chatSessions).where(eq(chatSessions.clientId, clientId));
  }

  async updateChatSession(id: number, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    const now = new Date();
    const result = await db.update(chatSessions)
      .set({ ...updates, lastActive: now })
      .where(eq(chatSessions.id, id))
      .returning();
    
    return result[0];
  }

  // Chat message operations
  async getChatMessagesBySessionId(sessionId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const now = new Date();
    const result = await db.insert(chatMessages).values({
      ...message,
      timestamp: now
    }).returning();
    
    const newMessage = result[0];
    
    // Update session lastActive
    if (newMessage.sessionId) {
      await db.update(chatSessions)
        .set({ lastActive: now })
        .where(eq(chatSessions.id, newMessage.sessionId));
      
      // Get session to find client id
      const sessionResult = await db.select().from(chatSessions).where(eq(chatSessions.id, newMessage.sessionId));
      const session = sessionResult[0];
      
      if (session && session.clientId) {
        await this.incrementMessageCount(session.clientId);
        
        // If message needs support, increment support request count
        if (newMessage.needsSupport) {
          await this.incrementSupportRequestCount(session.clientId);
        }
      }
    }
    
    return newMessage;
  }

  // Statistics operations
  async createStatistic(stat: InsertStatistic): Promise<Statistic> {
    const now = new Date();
    const result = await db.insert(statistics).values({
      ...stat,
      date: now
    }).returning();
    
    return result[0];
  }

  async getStatisticsByClientId(clientId: number): Promise<Statistic[]> {
    return db.select().from(statistics)
      .where(eq(statistics.clientId, clientId))
      .orderBy(statistics.date, 'desc');
  }

  async incrementMessageCount(clientId: number): Promise<void> {
    const stats = await this.getStatisticsByClientId(clientId);
    if (stats.length > 0) {
      const latestStat = stats[0];
      const messageCount = (latestStat.messageCount || 0) + 1;
      
      await db.update(statistics)
        .set({ messageCount })
        .where(eq(statistics.id, latestStat.id));
    }
  }

  async incrementUserCount(clientId: number): Promise<void> {
    const stats = await this.getStatisticsByClientId(clientId);
    if (stats.length > 0) {
      const latestStat = stats[0];
      const userCount = (latestStat.userCount || 0) + 1;
      
      await db.update(statistics)
        .set({ userCount })
        .where(eq(statistics.id, latestStat.id));
    }
  }
  
  async incrementSupportRequestCount(clientId: number): Promise<void> {
    const stats = await this.getStatisticsByClientId(clientId);
    if (stats.length > 0) {
      const latestStat = stats[0];
      const supportRequestCount = (latestStat.supportRequestCount || 0) + 1;
      
      await db.update(statistics)
        .set({ supportRequestCount })
        .where(eq(statistics.id, latestStat.id));
    }
  }

  async getDashboardStats(): Promise<{ totalBots: number; messagesToday: number; activeUsers: number; supportRequests: number }> {
    // Count total clients
    const clientsResult = await db.select().from(clients);
    const totalBots = clientsResult.length;
    
    // Sum statistics
    const statsResult = await db.select().from(statistics);
    
    let messagesToday = 0;
    let activeUsers = 0;
    let supportRequests = 0;
    
    for (const stat of statsResult) {
      messagesToday += (stat.messageCount || 0);
      activeUsers += (stat.userCount || 0);
      supportRequests += (stat.supportRequestCount || 0);
    }
    
    return {
      totalBots,
      messagesToday,
      activeUsers,
      supportRequests
    };
  }
}

// Create and initialize the database storage
export const storage = new DatabaseStorage();
