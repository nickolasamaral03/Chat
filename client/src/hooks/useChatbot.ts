import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { apiRequest } from "@/lib/queryClient";
import { v4 as uuidv4 } from "uuid";

interface ChatMessage {
  id?: number;
  content: string;
  isUserMessage: boolean;
  timestamp?: string;
}

interface UseChatbotProps {
  clientId: number;
  sessionToken?: string;
  welcomeMessage?: string;
}

export function useChatbot({ clientId, sessionToken: propSessionToken, welcomeMessage = "Olá! Como posso ajudar você hoje?" }: UseChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useLocalStorage<string | undefined>(`chatboot-session-${clientId}`, propSessionToken);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        if (!sessionToken) {
          // Create a new session
          const result = await apiRequest('POST', '/api/chat/sessions', {
            clientId,
            sessionToken: uuidv4(),
          });
          
          const data = await result.json();
          setSessionToken(data.sessionToken);
          setSessionId(data.id);
          
          // Add welcome message
          setMessages([
            {
              content: welcomeMessage,
              isUserMessage: false,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          // Get existing session
          const result = await apiRequest('GET', `/api/chat/sessions/${sessionToken}`);
          const data = await result.json();
          
          setSessionId(data.session.id);
          
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            // Add welcome message if no messages
            setMessages([
              {
                content: welcomeMessage,
                isUserMessage: false,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat session:', error);
        // If token is invalid, clear it and restart
        setSessionToken(undefined);
      } finally {
        setIsLoading(false);
      }
    };
    
    initSession();
  }, [clientId, sessionToken, setSessionToken, welcomeMessage]);
  
  // Function to send a message
  const sendMessage = async (content: string) => {
    if (!sessionId) return;
    
    try {
      // Optimistically update UI
      const newUserMessage: ChatMessage = {
        content,
        isUserMessage: true,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
      // Save to API
      await apiRequest('POST', '/api/chat/messages', {
        sessionId,
        content,
        isUserMessage: true,
      });
      
      // Simulate a response
      // In a real application, this would be a response from a real chatbot or agent
      setTimeout(async () => {
        const botResponse: ChatMessage = {
          content: "Obrigado pela sua mensagem! Um atendente irá responder em breve.",
          isUserMessage: false,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, botResponse]);
        
        // Save bot response to API
        await apiRequest('POST', '/api/chat/messages', {
          sessionId,
          content: botResponse.content,
          isUserMessage: false,
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  return {
    messages,
    sendMessage,
    isLoading,
    sessionToken,
  };
}
