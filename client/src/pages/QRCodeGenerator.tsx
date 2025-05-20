import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { apiRequest } from "@/lib/queryClient";
import { downloadQRCode, shareQRCode } from "@/lib/utils/qr";
import { SessionTimeoutOption } from "@shared/types";

export default function QRCodeGenerator() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const qrCodeRef = useRef<SVGSVGElement>(null);
  
  const [sessionTimeout, setSessionTimeout] = useState<SessionTimeoutOption>("never");
  const [usePhoneIntegration, setUsePhoneIntegration] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  // Fetch client info
  const { data: client, isLoading } = useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error('Failed to fetch client');
      return await res.json();
    }
  });
  
  // Generate QR code mutation
  const generateQR = useMutation({
    mutationFn: async () => {
      const data = {
        clientId: id,
        sessionTimeout,
        phoneNumber: usePhoneIntegration ? phoneNumber : undefined,
      };
      
      const res = await apiRequest('POST', '/api/qr/generate', data);
      return await res.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrUrl);
    },
  });
  
  const handleGenerateQR = () => {
    generateQR.mutate();
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
          <div id="qr-section" className="mb-10">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-100 mb-6">QR Code para Acesso</h2>
            
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4">{client.name}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      Escaneie este QR Code para acessar o ChatBoot no seu dispositivo móvel. 
                      O usuário poderá acessar o chat direto sem precisar realizar login novamente.
                    </p>
                    
                    <div className="space-y-4">
                      {/* Session Options */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Opções de sessão</h4>
                        <RadioGroup 
                          value={sessionTimeout} 
                          onValueChange={(value) => setSessionTimeout(value as SessionTimeoutOption)}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="never" id="never" />
                            <Label htmlFor="never">Sem tempo limite (a sessão não expira)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="24h" id="24h" />
                            <Label htmlFor="24h">Expira após 24 horas</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="7d" id="7d" />
                            <Label htmlFor="7d">Expira após 7 dias</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {/* Phone Integration */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Integração com telefone</h4>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <Checkbox
                              id="phone-integration"
                              checked={usePhoneIntegration}
                              onCheckedChange={(checked) => setUsePhoneIntegration(checked === true)}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <Label htmlFor="phone-integration" className="font-medium text-neutral-700 dark:text-neutral-300">
                              Vincular ao número de telefone
                            </Label>
                            <p className="text-neutral-500 dark:text-neutral-400">
                              O ChatBoot será automaticamente conectado quando o usuário acessar pelo mesmo dispositivo.
                            </p>
                          </div>
                        </div>
                        
                        {usePhoneIntegration && (
                          <div className="mt-3">
                            <Label htmlFor="phone-number" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Número de telefone
                            </Label>
                            <Input
                              id="phone-number"
                              type="tel"
                              placeholder="Ex: +55 11 99999-9999"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4">
                        <Button
                          className="bg-primary-500 hover:bg-primary-600 text-white"
                          onClick={handleGenerateQR}
                          disabled={generateQR.isPending}
                        >
                          {generateQR.isPending ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Gerando...
                            </div>
                          ) : (
                            <>
                              <i className="ri-refresh-line mr-1"></i> Gerar novo QR Code
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-sm mb-4 flex items-center justify-center">
                      {qrCodeUrl ? (
                        <div className="p-2 bg-white">
                          <QRCodeSVG
                            ref={qrCodeRef}
                            value={qrCodeUrl}
                            size={200}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"H"}
                            includeMargin={false}
                          />
                        </div>
                      ) : (
                        <div className="w-52 h-52 bg-neutral-100 dark:bg-neutral-700 rounded flex items-center justify-center">
                          <p className="text-neutral-500 dark:text-neutral-400 text-center px-4">
                            Clique em "Gerar novo QR Code" para criar um código de acesso
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => qrCodeUrl && downloadQRCode(qrCodeRef, client.name)}
                        disabled={!qrCodeUrl}
                      >
                        <i className="ri-download-line mr-1"></i> Baixar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => qrCodeUrl && shareQRCode(qrCodeUrl, client.name)}
                        disabled={!qrCodeUrl}
                      >
                        <i className="ri-share-line mr-1"></i> Compartilhar
                      </Button>
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
