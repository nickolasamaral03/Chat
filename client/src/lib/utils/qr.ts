// QR Code utility functions
import { QRCodeSVG } from 'qrcode.react';

export function generateQRCodeUrl(sessionToken: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}/chat/${sessionToken}`;
}

export function downloadQRCode(svgRef: React.RefObject<SVGSVGElement>, clientName: string): void {
  if (!svgRef.current) return;
  
  // Get the SVG as a string
  const svgData = new XMLSerializer().serializeToString(svgRef.current);
  
  // Create a Blob from the SVG data
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  // Create a link to download the SVG
  const link = document.createElement('a');
  link.href = url;
  link.download = `qrcode-${clientName.toLowerCase().replace(/\s+/g, '-')}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export function shareQRCode(qrCodeUrl: string, clientName: string): void {
  if (navigator.share) {
    navigator.share({
      title: `ChatBoot QR Code - ${clientName}`,
      text: `Escaneie este QR Code para acessar o chat da ${clientName}`,
      url: qrCodeUrl,
    }).catch((error) => console.log('Error sharing', error));
  } else {
    // Fallback to copy to clipboard
    navigator.clipboard.writeText(qrCodeUrl)
      .then(() => alert('URL do QR Code copiada para a área de transferência'))
      .catch((error) => console.error('Erro ao copiar: ', error));
  }
}
