import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("max-w-7xl mx-auto px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
