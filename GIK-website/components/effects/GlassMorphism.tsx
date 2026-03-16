"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassMorphismProps {
  children: ReactNode;
  blur?: number;
  opacity?: number;
  border?: boolean;
  dark?: boolean;
  className?: string;
  as?: React.ElementType;
}

export function GlassMorphism({
  children,
  blur = 12,
  opacity = 0.6,
  border = true,
  dark = false,
  className,
  as: Tag = "div",
}: GlassMorphismProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;

  const bg = dark
    ? `rgba(27, 24, 22, ${opacity})`
    : `rgba(244, 240, 234, ${opacity})`;

  const borderColor = dark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(27, 24, 22, 0.06)";

  return (
    <Component
      className={cn("relative", className)}
      style={{
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        backgroundColor: bg,
        border: border ? `1px solid ${borderColor}` : "none",
      }}
    >
      {children}
    </Component>
  );
}
