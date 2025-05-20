import { Link } from "wouter";
import type { ClientWithStats } from "@shared/types";

interface ClientCardProps {
  client: ClientWithStats;
}

export function ClientCard({ client }: ClientCardProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Determine background and text colors based on client.primaryColor
  // This is a simplified version; in a real app we'd extract the color value and convert it
  const getBgColor = (category: string) => {
    switch (category) {
      case 'E-commerce':
        return 'bg-primary-100 text-primary-600';
      case 'Alimentação':
        return 'bg-secondary-100 text-secondary-600';
      case 'Saúde':
        return 'bg-accent-100 text-accent-600';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };
  
  const colorClasses = getBgColor(client.category);
  
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full ${colorClasses} flex items-center justify-center font-semibold text-lg`}>
              {getInitials(client.name)}
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-neutral-800 dark:text-neutral-100">{client.name}</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{client.category}</p>
            </div>
          </div>
          <div className="flex">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              {client.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-5">
          <div className="flex items-center">
            <i className="ri-message-3-line mr-1"></i>
            <span>{client.messageCount} msgs</span>
          </div>
          <div className="flex items-center">
            <i className="ri-user-line mr-1"></i>
            <span>{client.userCount} usuários</span>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Link href={`/config/${client.id}`}>
            <a className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              <i className="ri-settings-4-line mr-1"></i>
              Configurar
            </a>
          </Link>
          <Link href={`/qrcode/${client.id}`}>
            <a className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 font-medium">
              <i className="ri-qr-code-line mr-1"></i>
              QR Code
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
