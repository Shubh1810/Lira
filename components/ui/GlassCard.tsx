import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn(
      "bg-gray-900/50 border border-gray-800 rounded-lg",
      className
    )}>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
} 