import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
  subtitle?: string;
}

export function StatCard({ 
  icon: Icon, 
  iconColor, 
  value, 
  label, 
  subtitle 
}: StatCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
      <Icon className={`w-5 h-5 ${iconColor} mx-auto mb-1`} />
      <div className="text-lg font-bold text-gray-100">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
} 