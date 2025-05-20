import { Client, ChatSession, ChatMessage, Statistic, CustomResponse, SupportChat, SupportMessage } from './schema';

// Types for frontend state management
export interface ChatbotConfig {
  id: number;
  name: string;
  category: string;
  logo?: string;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  chatTitle: string;
  welcomeMessage: string;
}

export interface ChatMessageUI {
  id: number;
  content: string;
  isUserMessage: boolean;
  timestamp: string;
  needsSupport?: boolean;
}

export interface ChatSessionData {
  sessionToken: string;
  clientId: number;
  phoneNumber?: string;
  messages: ChatMessageUI[];
  lastActive: string;
}

export interface DashboardStats {
  totalBots: number;
  messagesToday: number;
  activeUsers: number;
  supportRequests: number;
}

export interface ClientWithStats extends Client {
  messageCount: number;
  userCount: number;
  supportRequestCount: number;
}

export interface QRCodeOptions {
  sessionTimeout: 'never' | '24h' | '7d';
  usePhoneIntegration: boolean;
  phoneNumber?: string;
}

export type SessionTimeoutOption = 'never' | '24h' | '7d';

export interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface SupportAgentWithUser {
  id: number;
  userId: number;
  isAvailable: boolean;
  lastActive: string;
  user?: User;
}

export interface SupportChatWithRelations extends SupportChat {
  client?: Client;
  session?: ChatSession;
  messages?: SupportMessage[];
}

export interface CustomResponseForm {
  clientId: number;
  keyword: string;
  response: string;
  isActive: boolean;
}