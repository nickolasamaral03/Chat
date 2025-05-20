import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatbot } from "@/hooks/useChatbot";

interface ChatWidgetProps {
  clientId: number;
  sessionToken?: string;
  primaryColor?: string;
  secondaryColor?: string;
  chatTitle?: string;
  welcomeMessage?: string;
  logo?: string;
  standalone?: boolean;
}

export function ChatWidget({
  clientId,
  sessionToken,
  primaryColor = "#3B82F6",
  secondaryColor = "#10B981",
  chatTitle = "Atendimento",
  welcomeMessage = "Olá! Como posso ajudar você hoje?",
  logo,
  standalone = false,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(standalone ? true : false);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage } = useChatbot({
    clientId,
    sessionToken,
    welcomeMessage,
  });
  
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Create custom style based on primary color
  const headerStyle = {
    backgroundColor: primaryColor,
  };
  
  const buttonStyle = {
    backgroundColor: primaryColor,
  };
  
  const userMessageStyle = {
    backgroundColor: `${primaryColor}15`, // 15% opacity
    color: primaryColor,
  };
  
  if (!isOpen && !standalone) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={buttonStyle}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-white hover:opacity-90 transition-opacity z-50"
      >
        <i className="ri-message-3-line text-xl"></i>
      </button>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden ${standalone ? "" : "fixed bottom-4 right-4 w-80 z-50"}`}>
      {/* Chat Header */}
      <div style={headerStyle} className="text-white p-3 flex items-center justify-between">
        <div className="flex items-center">
          {logo ? (
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
              <img
                src={logo}
                alt="Logo"
                className="w-6 h-6 object-cover rounded-full"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
              <i className="ri-customer-service-2-line text-lg" style={{ color: primaryColor }}></i>
            </div>
          )}
          <span className="font-medium">{chatTitle}</span>
        </div>
        {!standalone && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-neutral-200 p-1"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}
      </div>
      
      {/* Chat Messages */}
      <div className="h-80 p-3 overflow-y-auto bg-neutral-50 dark:bg-neutral-900" id="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isUserMessage ? "justify-end" : ""} mb-3`}>
            <div
              style={msg.isUserMessage ? userMessageStyle : {}}
              className={`${
                msg.isUserMessage
                  ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                  : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
              } rounded-lg p-3 text-sm max-w-[85%]`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-3">
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="block w-full"
          />
          <Button
            onClick={handleSendMessage}
            style={buttonStyle}
            className="ml-2 text-white p-2 rounded-full flex items-center justify-center hover:opacity-90"
          >
            <i className="ri-send-plane-fill"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
