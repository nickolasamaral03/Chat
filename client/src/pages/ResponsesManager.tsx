import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomResponse, CustomResponseForm } from "@shared/types";

export default function ResponsesManager() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteResponseId, setDeleteResponseId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CustomResponseForm>({
    clientId: parseInt(id),
    keyword: "",
    response: "",
    isActive: true
  });
  
  // Fetch client info
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error('Failed to fetch client');
      return await res.json();
    }
  });
  
  // Fetch responses
  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: [`/api/responses/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/responses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch responses');
      return await res.json() as CustomResponse[];
    }
  });
  
  // Create response mutation
  const createResponse = useMutation({
    mutationFn: async (data: CustomResponseForm) => {
      const res = await apiRequest('POST', '/api/responses', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${id}`] });
      toast({
        title: "Resposta criada",
        description: "A resposta personalizada foi criada com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar",
        description: "Ocorreu um erro ao tentar criar a resposta personalizada.",
        variant: "destructive",
      });
    },
  });
  
  // Update response mutation
  const updateResponse = useMutation({
    mutationFn: async ({ responseId, data }: { responseId: number, data: Partial<CustomResponseForm> }) => {
      const res = await apiRequest('PUT', `/api/responses/${responseId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${id}`] });
      toast({
        title: "Resposta atualizada",
        description: "A resposta personalizada foi atualizada com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao tentar atualizar a resposta personalizada.",
        variant: "destructive",
      });
    },
  });
  
  // Delete response mutation
  const deleteResponse = useMutation({
    mutationFn: async (responseId: number) => {
      await apiRequest('DELETE', `/api/responses/${responseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${id}`] });
      toast({
        title: "Resposta excluída",
        description: "A resposta personalizada foi excluída com sucesso.",
      });
      setDeleteResponseId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao tentar excluir a resposta personalizada.",
        variant: "destructive",
      });
    },
  });
  
  // Toggle response active state
  const toggleActive = useMutation({
    mutationFn: async ({ responseId, isActive }: { responseId: number, isActive: boolean }) => {
      const res = await apiRequest('PUT', `/api/responses/${responseId}`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao tentar atualizar o status da resposta.",
        variant: "destructive",
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && formData.id) {
      const { id: responseId, clientId, ...updates } = formData;
      updateResponse.mutate({ responseId, data: updates });
    } else {
      createResponse.mutate(formData);
    }
  };
  
  const openCreateDialog = () => {
    setIsEditing(false);
    resetForm();
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (response: CustomResponse) => {
    setIsEditing(true);
    setFormData({
      id: response.id,
      clientId: response.clientId,
      keyword: response.keyword,
      response: response.response,
      isActive: response.isActive
    });
    setIsDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      clientId: parseInt(id),
      keyword: "",
      response: "",
      isActive: true
    });
  };
  
  if (clientLoading) {
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
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-100">Respostas Personalizadas</h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Configure respostas automáticas para {client.name}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate(`/config/${id}`)}>
                <i className="ri-settings-4-line mr-1"></i> Configurações
              </Button>
              <Button
                className="bg-primary-500 hover:bg-primary-600 text-white"
                onClick={openCreateDialog}
              >
                <i className="ri-add-line mr-1"></i> Nova Resposta
              </Button>
            </div>
          </div>
          
          {responsesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
              <Table>
                <TableCaption>Lista de respostas personalizadas para {client.name}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Palavra-chave</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead className="w-[120px]">Ativo</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses && responses.length > 0 ? (
                    responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">{response.keyword}</TableCell>
                        <TableCell className="truncate max-w-md">{response.response}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={response.isActive} 
                            onCheckedChange={(checked) => toggleActive.mutate({ responseId: response.id, isActive: checked })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(response)}>
                              <i className="ri-edit-line"></i>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-red-500">
                                  <i className="ri-delete-bin-line"></i>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A resposta para a palavra-chave "{response.keyword}" será permanentemente excluída.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => deleteResponse.mutate(response.id)}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                        Nenhuma resposta personalizada configurada.
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={openCreateDialog}
                          >
                            <i className="ri-add-line mr-1"></i> Adicionar resposta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Resposta' : 'Nova Resposta'}</DialogTitle>
            <DialogDescription>
              Configure uma resposta automatizada que será acionada quando a palavra-chave for mencionada pelo usuário.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="keyword">Palavra-chave</Label>
                <Input
                  id="keyword"
                  name="keyword"
                  placeholder="Ex: horário, preço, entrega"
                  value={formData.keyword}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Esta é a palavra que vai acionar a resposta automática quando mencionada pelo usuário.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="response">Resposta</Label>
                <Textarea
                  id="response"
                  name="response"
                  placeholder="Digite aqui a resposta completa que será enviada automaticamente..."
                  rows={5}
                  value={formData.response}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isActive">Resposta ativa</Label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-primary-500 hover:bg-primary-600"
                disabled={createResponse.isPending || updateResponse.isPending}
              >
                {(createResponse.isPending || updateResponse.isPending) ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </div>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}