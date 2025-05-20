import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorPicker } from "@/components/ColorPicker";
import { ChatWidget } from "@/components/ChatWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChatConfig() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch client info
  const { data: client, isLoading } = useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error('Failed to fetch client');
      return await res.json();
    }
  });
  
  const [formData, setFormData] = useState({
    name: client?.name || "",
    category: client?.category || "",
    primaryColor: client?.primaryColor || "#3B82F6",
    secondaryColor: client?.secondaryColor || "#10B981",
    chatTitle: client?.chatTitle || "",
    welcomeMessage: client?.welcomeMessage || "",
    logo: client?.logo || "",
  });
  
  // Update form data when client data loads
  if (client && client.name && formData.name === "") {
    setFormData({
      name: client.name,
      category: client.category,
      primaryColor: client.primaryColor,
      secondaryColor: client.secondaryColor,
      chatTitle: client.chatTitle,
      welcomeMessage: client.welcomeMessage,
      logo: client.logo || "",
    });
  }
  
  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('PUT', `/api/clients/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      toast({
        title: "Alterações salvas",
        description: "As configurações do ChatBoot foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao tentar salvar as alterações.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClient.mutate(formData);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Cliente não encontrado</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">O cliente que você está procurando não existe ou foi removido.</p>
              <Button onClick={() => navigate('/')}>Voltar para o Dashboard</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div id="config-section" className="mb-10">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-100 mb-6">Configurar ChatBoot</h2>
            
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-1">{client.name}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Personalize o ChatBoot para este cliente</p>
                  </div>
                  <Button
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                    onClick={handleSubmit}
                    disabled={updateClient.isPending}
                  >
                    {updateClient.isPending ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </div>
                    ) : (
                      <>
                        <i className="ri-save-line mr-1"></i> Salvar alterações
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                      <Tabs defaultValue="appearance">
                        <TabsList className="w-full border-b mb-6">
                          <TabsTrigger value="appearance">Aparência</TabsTrigger>
                          <TabsTrigger value="messages">Mensagens</TabsTrigger>
                          <TabsTrigger value="integration">Integração</TabsTrigger>
                          <TabsTrigger value="advanced">Avançado</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="appearance" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorPicker
                              color={formData.primaryColor}
                              onChange={(color) => setFormData(prev => ({ ...prev, primaryColor: color }))}
                              label="Cor principal"
                            />
                            
                            <ColorPicker
                              color={formData.secondaryColor}
                              onChange={(color) => setFormData(prev => ({ ...prev, secondaryColor: color }))}
                              label="Cor secundária"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="chatTitle" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Título da janela de chat
                            </label>
                            <Input
                              id="chatTitle"
                              name="chatTitle"
                              value={formData.chatTitle}
                              onChange={handleInputChange}
                              className="block w-full"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="welcomeMessage" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Mensagem de boas-vindas
                            </label>
                            <Textarea
                              id="welcomeMessage"
                              name="welcomeMessage"
                              value={formData.welcomeMessage}
                              onChange={handleInputChange}
                              rows={3}
                              className="block w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Logo da empresa
                            </label>
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center overflow-hidden">
                                {formData.logo ? (
                                  <img
                                    src={formData.logo}
                                    alt="Logo preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <i className="ri-image-line text-neutral-400 text-xl"></i>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  // In a real app, this would open a file picker
                                  // For this demo, we'll use a sample URL
                                  const logo = prompt("Enter logo URL", formData.logo);
                                  if (logo) {
                                    setFormData(prev => ({ ...prev, logo }));
                                  }
                                }}
                              >
                                Trocar logo
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="messages" className="space-y-6">
                          <p className="text-neutral-600 dark:text-neutral-400">
                            Configurações de mensagens em desenvolvimento.
                          </p>
                        </TabsContent>
                        
                        <TabsContent value="integration" className="space-y-6">
                          <p className="text-neutral-600 dark:text-neutral-400">
                            Configurações de integração em desenvolvimento.
                          </p>
                        </TabsContent>
                        
                        <TabsContent value="advanced" className="space-y-6">
                          <p className="text-neutral-600 dark:text-neutral-400">
                            Configurações avançadas em desenvolvimento.
                          </p>
                        </TabsContent>
                      </Tabs>
                    </form>
                  </div>
                  
                  {/* Preview Panel */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Pré-visualização</h4>
                    
                    <div className="relative border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm bg-neutral-50 dark:bg-neutral-900 h-[500px] overflow-hidden">
                      {/* Mobile Device Frame */}
                      <div className="absolute inset-4 bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-700">
                        {/* Device Header */}
                        <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-3 flex justify-between items-center">
                          <div className="w-20 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                          <div className="w-3 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                        </div>
                        
                        {/* Browser Frame */}
                        <div className="flex-1 flex flex-col">
                          {/* Browser Header */}
                          <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-2 flex items-center">
                            <div className="flex space-x-1.5 ml-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mx-auto px-4 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-[8px] text-neutral-600 dark:text-neutral-400 max-w-[120px] truncate">
                              {client.name.toLowerCase().replace(/\s+/g, '')}.com.br
                            </div>
                          </div>
                          
                          {/* Site Content */}
                          <div className="flex-1 bg-white dark:bg-neutral-800 p-3 relative overflow-hidden">
                            {/* Placeholder site content */}
                            <div className="h-6 bg-neutral-100 dark:bg-neutral-700 rounded-md mb-3"></div>
                            <div className="h-24 bg-neutral-100 dark:bg-neutral-700 rounded-md mb-3"></div>
                            <div className="h-6 bg-neutral-100 dark:bg-neutral-700 rounded-md w-3/4 mb-3"></div>
                            <div className="h-20 bg-neutral-100 dark:bg-neutral-700 rounded-md mb-3"></div>
                            
                            {/* Chat Widget Preview */}
                            <div className="absolute bottom-3 right-3 flex flex-col items-end">
                              {/* Mini ChatWidget for preview */}
                              <div className="bg-white dark:bg-neutral-700 shadow-lg rounded-lg border border-neutral-200 dark:border-neutral-600 w-48 mb-2 overflow-hidden">
                                <div style={{ backgroundColor: formData.primaryColor }} className="text-white p-2 text-xs font-medium flex items-center justify-between">
                                  <span>{formData.chatTitle}</span>
                                  <button type="button" className="text-white">
                                    <i className="ri-close-line"></i>
                                  </button>
                                </div>
                                <div className="p-2">
                                  <div className="bg-neutral-100 dark:bg-neutral-600 rounded-lg p-2 text-[9px] text-neutral-800 dark:text-neutral-200 mb-2">
                                    {formData.welcomeMessage}
                                  </div>
                                  <div className="flex">
                                    <input
                                      type="text"
                                      className="text-[9px] block w-full border-0 bg-neutral-50 dark:bg-neutral-800 rounded-md px-2 py-1 focus:ring-0"
                                      placeholder="Digite sua mensagem..."
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Chat Button */}
                              <button
                                type="button"
                                style={{ backgroundColor: formData.primaryColor }}
                                className="rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                              >
                                <i className="ri-message-3-line text-white"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
