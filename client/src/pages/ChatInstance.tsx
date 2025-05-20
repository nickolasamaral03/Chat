import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChatWidget } from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatInstance() {
  const { token } = useParams<{ token: string }>();
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch session and client info
  const { data } = useQuery({
    queryKey: [`/api/chat/sessions/${token}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${token}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Sessão de chat não encontrada ou expirada.");
          }
          throw new Error("Erro ao carregar a sessão de chat.");
        }
        
        const data = await res.json();
        return data;
      } catch (err) {
        setError((err as Error).message || "Erro desconhecido");
        throw err;
      }
    },
    retry: false,
    enabled: !!token,
  });
  
  // Fetch client details once we have the session
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: [`/api/clients/${data?.session?.clientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${data.session.clientId}`);
      if (!res.ok) throw new Error('Failed to fetch client');
      return await res.json();
    },
    enabled: !!data?.session?.clientId,
  });
  
  useEffect(() => {
    if (data && client) {
      setIsLoading(false);
    }
  }, [data, client]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-red-500 dark:text-red-300 text-xl"></i>
            </div>
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Erro</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/')}>Voltar para o Início</Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading || clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <div className="w-full max-w-lg">
        {client && (
          <ChatWidget
            clientId={client.id}
            sessionToken={token}
            chatTitle={client.chatTitle}
            welcomeMessage={client.welcomeMessage}
            primaryColor={client.primaryColor}
            secondaryColor={client.secondaryColor}
            logo={client.logo}
            standalone={true}
          />
        )}
      </div>
    </div>
  );
}
