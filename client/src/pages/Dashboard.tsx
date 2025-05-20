import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { ClientCard } from "@/components/ClientCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatWidget } from "@/components/ChatWidget";
import { ClientWithStats } from "@shared/types";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    }
  });
  
  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      return await res.json() as ClientWithStats[];
    }
  });
  
  useEffect(() => {
    // Set focus on dashboard when loaded
    if (window.location.hash === '#dashboard') {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (window.location.hash === '#clients') {
      document.getElementById('clients')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div id="dashboard" className="mb-10">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-100 mb-6">Gestão de ChatBoot</h2>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {statsLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                <>
                  <StatCard
                    icon={<i className="ri-customer-service-2-line"></i>}
                    label="Total de ChatBoots"
                    value={stats?.totalBots || 0}
                    bgColor="bg-primary-100 dark:bg-primary-900"
                    iconColor="text-primary-600 dark:text-primary-400"
                  />
                  <StatCard
                    icon={<i className="ri-message-3-line"></i>}
                    label="Mensagens hoje"
                    value={stats?.messagesToday || 0}
                    bgColor="bg-secondary-100 dark:bg-secondary-900"
                    iconColor="text-secondary-600 dark:text-secondary-400"
                  />
                  <StatCard
                    icon={<i className="ri-user-line"></i>}
                    label="Usuários ativos"
                    value={stats?.activeUsers || 0}
                    bgColor="bg-accent-100 dark:bg-accent-900"
                    iconColor="text-accent-600 dark:text-accent-400"
                  />
                </>
              )}
            </div>
            
            {/* Client ChatBoots */}
            <div id="clients" className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-heading font-semibold text-neutral-800 dark:text-neutral-100">Seus ChatBoots</h3>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  <i className="ri-add-line mr-1"></i> Novo ChatBoot
                </Button>
              </div>
              
              {clientsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clients?.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Demo Chat Widget */}
      {clients && clients.length > 0 && (
        <ChatWidget
          clientId={clients[0].id}
          chatTitle={clients[0].chatTitle}
          welcomeMessage={clients[0].welcomeMessage}
          primaryColor={clients[0].primaryColor}
          secondaryColor={clients[0].secondaryColor}
        />
      )}
    </div>
  );
}
