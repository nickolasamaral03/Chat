import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { initDb } from "./initDb";
import { randomUUID } from "crypto";
import { z } from "zod";
import { 
  insertClientSchema, 
  insertChatSessionSchema, 
  insertChatMessageSchema,
  insertCustomResponseSchema,
  insertSupportMessageSchema,
  insertSupportChatSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'join_support_chat') {
          // Store chat ID in the WebSocket object for later use
          (ws as any).chatId = data.chatId;
          (ws as any).userId = data.userId;
          
          console.log(`User joined support chat: ${data.chatId}`);
        } 
        else if (data.type === 'support_message' && data.chatId && data.content) {
          // Create a new support message
          const newMessage = await storage.createSupportMessage({
            chatId: data.chatId,
            senderId: data.userId || null,
            content: data.content,
            isRead: false
          });
          
          // Broadcast the message to all clients in this chat
          wss.clients.forEach((client) => {
            if ((client as any).chatId === data.chatId && client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                type: 'support_message',
                message: newMessage
              }));
            }
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // API routes
  const apiRouter = express.Router();
  
  // Initialize database
  apiRouter.post("/init-db", async (req: Request, res: Response) => {
    try {
      await initDb();
      res.json({ message: "Database initialized successfully" });
    } catch (error) {
      console.error("Failed to initialize database:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });
  
  // Authentication
  apiRouter.post("/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // In a real app, you would validate the password hash
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Get support agent info if available
      const agents = await storage.getSupportAgents();
      const agent = agents.find(a => a.userId === user.id);
      
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
  
  // Dashboard statistics
  apiRouter.get("/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });
  
  // Client management
  apiRouter.get("/clients", async (req: Request, res: Response) => {
    try {
      const clients = await storage.getAllClients();
      
      // Get statistics for each client
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
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
  
  apiRouter.get("/clients/:id", async (req: Request, res: Response) => {
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
  
  apiRouter.post("/clients", async (req: Request, res: Response) => {
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
  
  apiRouter.put("/clients/:id", async (req: Request, res: Response) => {
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
  
  apiRouter.delete("/clients/:id", async (req: Request, res: Response) => {
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
  
  // Custom Responses management
  apiRouter.get("/responses/:clientId", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const responses = await storage.getCustomResponsesByClientId(clientId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom responses" });
    }
  });
  
  apiRouter.post("/responses", async (req: Request, res: Response) => {
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
  
  apiRouter.put("/responses/:id", async (req: Request, res: Response) => {
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
  
  apiRouter.delete("/responses/:id", async (req: Request, res: Response) => {
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
  
  // Support Agent management
  apiRouter.get("/agents", async (req: Request, res: Response) => {
    try {
      const agents = await storage.getSupportAgents();
      
      // Get user info for each agent
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
  
  // Support Chat management
  apiRouter.get("/support/chats", async (req: Request, res: Response) => {
    try {
      let chats;
      
      // If agentId is provided, get chats for that agent
      if (req.query.agentId) {
        const agentId = parseInt(req.query.agentId as string);
        chats = await storage.getSupportChatsByAgentId(agentId);
      } 
      // If clientId is provided, get chats for that client
      else if (req.query.clientId) {
        const clientId = parseInt(req.query.clientId as string);
        chats = await storage.getSupportChatsByClientId(clientId);
      } else {
        return res.status(400).json({ message: "Either agentId or clientId is required" });
      }
      
      // Add client and session info to each chat
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
  
  apiRouter.get("/support/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getSupportChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Support chat not found" });
      }
      
      // Get client and session info
      const client = await storage.getClientById(chat.clientId);
      const session = chat.sessionId ? await storage.getChatSession(chat.sessionId) : null;
      
      // Get messages for this chat
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
  
  apiRouter.post("/support/chats", async (req: Request, res: Response) => {
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
  
  apiRouter.put("/support/chats/:id", async (req: Request, res: Response) => {
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
  
  // Support Messages management
  apiRouter.get("/support/messages/:chatId", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await storage.getSupportMessagesByChatId(chatId);
      
      // Mark messages as read if userId is provided
      if (req.query.userId) {
        const userId = parseInt(req.query.userId as string);
        await storage.markSupportMessagesAsRead(chatId, userId);
      }
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support messages" });
    }
  });
  
  apiRouter.post("/support/messages", async (req: Request, res: Response) => {
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
  
  // Chat sessions
  apiRouter.post("/chat/sessions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatSessionSchema.parse({
        ...req.body,
        sessionToken: randomUUID(),
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
  
  apiRouter.get("/chat/sessions/:token", async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const session = await storage.getChatSessionByToken(token);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Get messages for this session
      const messages = await storage.getChatMessagesBySessionId(session.id);
      
      res.json({
        session,
        messages,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });
  
  // Chat messages
  apiRouter.post("/chat/messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      // Check if there's a custom response for this message
      let needsSupport = false;
      
      if (validatedData.isUserMessage && validatedData.sessionId) {
        // Get session to find client id
        const session = await storage.getChatSession(validatedData.sessionId);
        
        if (session && session.clientId) {
          // Get custom responses for this client
          const clientResponses = await storage.getCustomResponsesByClientId(session.clientId);
          
          // Check if any keyword matches
          const content = validatedData.content.toLowerCase();
          const matchingResponse = clientResponses.find(response => 
            response.isActive && content.includes(response.keyword.toLowerCase())
          );
          
          // If no match is found, flag as needs support
          if (!matchingResponse) {
            needsSupport = true;
          }
        }
      }
      
      // Create the message
      const message = await storage.createChatMessage({
        ...validatedData,
        needsSupport
      });
      
      // If message needs support, create a support chat
      if (needsSupport && message.sessionId) {
        // Get session to find client id
        const session = await storage.getChatSession(message.sessionId);
        
        if (session && session.clientId) {
          // Find an available agent
          const agents = await storage.getSupportAgents();
          const availableAgent = agents.find(agent => agent.isAvailable);
          
          if (availableAgent) {
            // Create support chat
            const supportChat = await storage.createSupportChat({
              clientId: session.clientId,
              sessionId: message.sessionId,
              agentId: availableAgent.id,
              status: 'pending'
            });
            
            // Create initial support message
            await storage.createSupportMessage({
              chatId: supportChat.id,
              senderId: null, // From client
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
  
  apiRouter.get("/chat/messages/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessagesBySessionId(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  // Generate QR code session
  apiRouter.post("/qr/generate", async (req: Request, res: Response) => {
    try {
      const { clientId, sessionTimeout, phoneNumber } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }
      
      // Calculate expiration time based on sessionTimeout
      let expiresAt: Date | null = null;
      
      if (sessionTimeout === '24h') {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      } else if (sessionTimeout === '7d') {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
      
      const session = await storage.createChatSession({
        clientId: parseInt(clientId),
        sessionToken: randomUUID(),
        phoneNumber: phoneNumber || undefined,
        expiresAt: expiresAt || undefined,
      });
      
      res.status(201).json({
        session,
        qrUrl: `${req.protocol}://${req.get('host')}/chat/${session.sessionToken}`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code session" });
    }
  });
  
  // Mount the API router
  app.use("/api", apiRouter);

  return httpServer;
}
