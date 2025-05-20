import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { CustomResponse, CustomResponseForm } from "@shared/types";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const responseSchema = z.object({
  clientId: z.number(),
  keyword: z.string().min(1, "Palavra-chave é obrigatória"),
  response: z.string().min(1, "Resposta é obrigatória"),
  isActive: z.boolean().default(true),
});

export default function ResponsesManager() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id);
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<CustomResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize the form
  const form = useForm<CustomResponseForm>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      clientId,
      keyword: "",
      response: "",
      isActive: true,
    },
  });

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
  });

  // Fetch responses
  const { data: responses = [], isLoading } = useQuery({
    queryKey: [`/api/responses/${clientId}`],
  });

  // Create response mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomResponseForm) => {
      const res = await apiRequest("POST", "/api/responses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${clientId}`] });
      setIsDialogOpen(false);
      form.reset({
        clientId,
        keyword: "",
        response: "",
        isActive: true,
      });
      toast({
        title: "Resposta criada",
        description: "Resposta personalizada criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar resposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update response mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CustomResponse) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/responses/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${clientId}`] });
      setIsDialogOpen(false);
      toast({
        title: "Resposta atualizada",
        description: "Resposta personalizada atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar resposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete response mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/responses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/responses/${clientId}`] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Resposta excluída",
        description: "Resposta personalizada excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir resposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomResponseForm) => {
    if (isEditing && currentResponse) {
      updateMutation.mutate({
        ...data,
        id: currentResponse.id,
        createdAt: currentResponse.createdAt,
        updatedAt: new Date().toISOString(),
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    form.reset({
      clientId,
      keyword: "",
      response: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (response: CustomResponse) => {
    setIsEditing(true);
    setCurrentResponse(response);
    form.reset({
      clientId: response.clientId,
      keyword: response.keyword,
      response: response.response,
      isActive: response.isActive,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (response: CustomResponse) => {
    setCurrentResponse(response);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Respostas Personalizadas</h1>
          <p className="text-neutral-500">
            {client ? `Cliente: ${client.name}` : "Carregando..."}
          </p>
        </div>
        <Button onClick={openAddDialog}>Adicionar Resposta</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p>Carregando respostas...</p>
        ) : responses.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-xl text-neutral-500 mb-4">
              Nenhuma resposta personalizada encontrada
            </p>
            <Button onClick={openAddDialog}>Adicionar Primeira Resposta</Button>
          </div>
        ) : (
          responses.map((response: CustomResponse) => (
            <Card key={response.id} className="border-t-4 border-t-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{response.keyword}</CardTitle>
                  <Badge variant={response.isActive ? "default" : "outline"}>
                    {response.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-neutral-600 whitespace-pre-wrap">
                  {response.response}
                </p>
                <Separator className="my-3" />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(response)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(response)}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Resposta" : "Adicionar Resposta"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavra-chave</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: horário_funcionamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="response"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resposta</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a resposta a ser enviada quando a palavra-chave for detectada"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-neutral-500">
                        Ative ou desative esta resposta
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta resposta personalizada?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => currentResponse && deleteMutation.mutate(currentResponse.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}