import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SupportChatWithRelations, SupportMessage } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Support() {
  const [selectedChat, setSelectedChat] = useState<SupportChatWithRelations | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // Fetch support chats
  const { data: chats = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/support/chats"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch messages for selected chat
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/support/messages", selectedChat?.id],
    enabled: !!selectedChat?.id,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Update selected chat with first chat on initial load
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat?.id) {
      fetch(`/api/support/chats/${selectedChat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    }
  }, [selectedChat, messages]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
      
      await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChat.id,
          userId,
          content: message,
          isFromAgent: true,
        }),
      });

      setMessage("");
      refetchMessages();
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  // Close chat
  const closeChat = async () => {
    if (!selectedChat) return;

    try {
      await fetch(`/api/support/chats/${selectedChat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      toast({
        title: "Atendimento finalizado",
        description: "O chat foi fechado com sucesso",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro ao finalizar atendimento",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  // Filter chats by status
  const activeChatCount = chats.filter((chat: SupportChatWithRelations) => chat.status === "active").length;
  const pendingChatCount = chats.filter((chat: SupportChatWithRelations) => chat.status === "pending").length;
  const closedChatCount = chats.filter((chat: SupportChatWithRelations) => chat.status === "closed").length;

  return (
    <div className="container py-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Central de Suporte</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Ativos: {activeChatCount}
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pendentes: {pendingChatCount}
          </Badge>
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800">
            Fechados: {closedChatCount}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Chat List */}
        <div className="col-span-4 overflow-y-auto border rounded-lg">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="closed">Fechados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="p-0">
              <ChatList 
                chats={chats.filter((chat: SupportChatWithRelations) => chat.status === "active")} 
                selectedChat={selectedChat} 
                setSelectedChat={setSelectedChat} 
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="pending" className="p-0">
              <ChatList 
                chats={chats.filter((chat: SupportChatWithRelations) => chat.status === "pending")} 
                selectedChat={selectedChat} 
                setSelectedChat={setSelectedChat} 
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="closed" className="p-0">
              <ChatList 
                chats={chats.filter((chat: SupportChatWithRelations) => chat.status === "closed")} 
                selectedChat={selectedChat} 
                setSelectedChat={setSelectedChat} 
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Messages */}
        <div className="col-span-8 border rounded-lg flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">{selectedChat.client?.name || "Cliente"}</h2>
                  <p className="text-sm text-neutral-500">
                    Iniciado {formatTime(selectedChat.createdAt)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={closeChat}
                  disabled={selectedChat.status === "closed"}
                >
                  Finalizar Atendimento
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg: SupportMessage) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isFromAgent ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isFromAgent
                          ? "bg-primary-100 text-primary-900"
                          : "bg-neutral-100 text-neutral-900"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className="text-xs text-neutral-500 block mt-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-neutral-500">Nenhuma mensagem ainda</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={selectedChat.status === "closed"}
                  />
                  <Button 
                    type="submit"
                    disabled={!message.trim() || selectedChat.status === "closed"}
                  >
                    Enviar
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-neutral-500">Selecione um chat para iniciar o atendimento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Chat List Component
function ChatList({ 
  chats, 
  selectedChat, 
  setSelectedChat, 
  isLoading 
}: { 
  chats: SupportChatWithRelations[];
  selectedChat: SupportChatWithRelations | null;
  setSelectedChat: (chat: SupportChatWithRelations) => void;
  isLoading: boolean;
}) {
  // Format time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Carregando conversas...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`p-4 cursor-pointer hover:bg-neutral-50 ${
            selectedChat?.id === chat.id ? "bg-neutral-100" : ""
          }`}
          onClick={() => setSelectedChat(chat)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{chat.client?.name || "Cliente"}</h3>
              <p className="text-sm text-neutral-500 truncate">
                {chat.lastMessage || "Sem mensagens"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">
                {formatTime(chat.updatedAt)}
              </p>
              {!chat.isRead && chat.status !== "closed" && (
                <Badge className="mt-1 bg-primary-500">Novo</Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}