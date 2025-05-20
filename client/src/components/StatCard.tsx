import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  bgColor: string;
  iconColor: string;
}

export function StatCard({ icon, label, value, bgColor, iconColor }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-full`}>
          <div className={`text-xl ${iconColor}`}>{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
          <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{value}</h3>
        </div>
      </div>
    </div>
  );
}
