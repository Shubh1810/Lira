import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  iconGradient: string;
  title: string;
  subtitle: string;
  rightElement?: ReactNode;
}

export function PageHeader({ 
  icon: Icon, 
  iconGradient, 
  title, 
  subtitle, 
  rightElement 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${iconGradient} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-100">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      {rightElement}
    </div>
  );
} 