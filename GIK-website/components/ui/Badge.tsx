import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type BadgeVariant = "default" | "utility" | "align" | "panel" | "limited";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-gik-linen text-gik-void",
  utility:
    "bg-gik-stone/20 text-gik-void",
  align:
    "bg-gik-earth/15 text-gik-earth",
  panel:
    "bg-gik-void/10 text-gik-void",
  limited:
    "bg-gik-earth text-gik-canvas",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1",
        "text-[10px] tracking-[0.15em] uppercase font-body font-medium",
        "select-none whitespace-nowrap",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
